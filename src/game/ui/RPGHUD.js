import {
    EQUIPMENT_SLOTS,
    SHOP_ITEMS,
    gearIcon
} from '../data/items.js';

import {
    ITEMS,
    DESTINATIONS
} from '../systems/RPGState.js';

const escape = value => String(value ?? '').replace(
    /[&<>"']/g,
    char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]
);

const icon = (frame, size = 40) => `
    <span
        class="rpg-icon"
        aria-hidden="true"
        style="
            width:${size}px;
            height:${size}px;
            background-size:${size * 12}px ${size * 11}px;
            background-position:
                -${frame % 12 * size}px
                -${Math.floor(frame / 12) * size}px;
        "
    ></span>
`;

const itemIcon = (item, size = 40) => (
    item?.icon
        ? gearIcon(item.icon, item.level, size)
        : icon(item?.frame ?? 103, size)
);

export class RPGHUD {
    constructor(scene, state, mapTitle) {
        this.scene = scene;
        this.state = state;
        this.mapTitle = mapTitle;

        this.tab = null;
        this.selected = 'health_potion';
        this.previewId = null;
        this.previewLeft = false;
        this.destroyed = false;

        // Cập nhật CSS kể cả khi style cũ đã tồn tại.
        let style = document.getElementById('tiny-rpg-hud-style');

        if (!style) {
            style = document.createElement('style');
            style.id = 'tiny-rpg-hud-style';
            document.head.appendChild(style);
        }

        style.textContent = CSS;

        this.root = document.createElement('div');
        this.root.className = 'rpg-ui';

        this.root.innerHTML = `
            <div class="rpg-overview"></div>

            <nav
                class="rpg-nav"
                aria-label="Menu nhân vật"
            ></nav>

            <div class="rpg-overlay" hidden>
                <section
                    class="rpg-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="rpg-modal-title"
                ></section>
            </div>

            <div
                class="rpg-toast"
                role="status"
                hidden
            ></div>
        `;

        document.body.appendChild(this.root);

        this.overlay = this.root.querySelector('.rpg-overlay');
        this.modal = this.root.querySelector('.rpg-modal');

        this.onClick = event => {
            const button = event.target.closest(
                'button[data-action]'
            );

            if (
                !button ||
                !this.root.contains(button) ||
                button.disabled
            ) {
                return;
            }

            const { action, id } = button.dataset;

            switch (action) {
                case 'tab':
                    if (
                        button.closest('.rpg-tabs') &&
                        this.tab === id
                    ) {
                        return;
                    }

                    this.toggle(id);
                    break;

                case 'close':
                    this.close();
                    break;

                case 'select':
                    this.selected = id;
                    this.previewId = null;
                    this.renderModal();
                    break;

                case 'preview':
                    this.previewId = this.selected;
                    this.renderModal();
                    break;

                case 'preview-reset':
                    this.previewId = null;
                    this.renderModal();
                    break;

                case 'preview-turn':
                    this.previewLeft = !this.previewLeft;
                    this.drawCharacterPreview();
                    break;

                case 'use':
                    if (!this.selected) return;

                    this.previewId = null;
                    this.toast(this.state.useItem(this.selected));
                    this.render();
                    break;

                case 'unequip': {
                    const slot = ITEMS[id]?.type;

                    if (
                        slot &&
                        this.state.data.equipment[slot] === id
                    ) {
                        this.previewId = null;
                        this.selected = id;

                        this.toast(this.state.useItem(id));
                        this.render();
                    }

                    break;
                }

                case 'buy':
                    if (
                        this.shopNPC &&
                        this.scene.dialogue?.nearest() ===
                            this.shopNPC
                    ) {
                        this.toast(
                            this.state.buyItem(id).message
                        );

                        this.render();
                    }

                    break;

                case 'filter':
                    this.shopCategory = id;
                    this.renderModal();
                    break;

                case 'tier':
                    this.shopLevel = Number(id);
                    this.renderModal();
                    break;

                case 'claim':
                    this.toast(this.state.claimExploration());
                    this.render();
                    break;
            }
        };

        this.onKey = event => {
            if (
                this.destroyed ||
                event.repeat ||
                event.ctrlKey ||
                event.altKey ||
                event.metaKey
            ) {
                return;
            }

            const key = event.key.toLowerCase();
            const tabs = {
                b: 'inventory',
                j: 'quests'
            };

            if (tabs[key]) {
                event.preventDefault();
                this.toggle(tabs[key]);
            } else if (key === 'escape' && this.tab) {
                event.preventDefault();
                this.close();
            } else if (key === 'tab' && this.tab) {
                const buttons = [
                    ...this.modal.querySelectorAll(
                        'button:not(:disabled)'
                    )
                ];

                const first = buttons[0];
                const last = buttons.at(-1);

                if (
                    event.shiftKey &&
                    document.activeElement === first
                ) {
                    event.preventDefault();
                    last?.focus();
                } else if (
                    !event.shiftKey &&
                    document.activeElement === last
                ) {
                    event.preventDefault();
                    first?.focus();
                }
            }
        };

        this.root.addEventListener('click', this.onClick);
        window.addEventListener('keydown', this.onKey);

        this.unsubscribe = state.subscribe(() => this.render());

        this.render();
    }

    get blocked() {
        return Boolean(this.tab);
    }

    bar(kind, label, value, max) {
        const percent = max > 0
            ? Math.max(0, Math.min(100, value / max * 100))
            : 0;

        return `
            <div
                class="rpg-bar ${kind}"
                role="progressbar"
                aria-label="${label}"
                aria-valuemin="0"
                aria-valuemax="${max}"
                aria-valuenow="${value}"
            >
                <div
                    class="rpg-fill"
                    style="width:${percent}%"
                ></div>

                <span class="rpg-bar-label">
                    ${label} ${value} / ${max}
                </span>
            </div>
        `;
    }

    render() {
        if (this.destroyed) return;

        const s = this.state;
        const d = s.data;

        // Đồng bộ vũ khí/khiên của nhân vật trong bản đồ.
        this.scene.player?.updateEquipment?.(
            d.equipment.weapon,
            d.equipment.shield
        );

        this.root.querySelector('.rpg-overview').innerHTML = `
            <div class="rpg-status">
                <div class="rpg-portrait">
                    ${icon(96, 48)}
                    <span class="rpg-level">LV ${d.level}</span>
                </div>

                <div class="rpg-meters">
                    <div class="rpg-name">Lữ khách</div>

                    ${this.bar('hp', 'HP', d.hp, s.maxHP)}
                    ${this.bar('mp', 'MP', d.mp, s.maxMP)}
                    ${this.bar('xp', 'EXP', d.exp, s.expNeeded)}
                </div>
            </div>

            <div class="rpg-location">
                <span class="rpg-location-name">
                    ${escape(this.mapTitle)}
                </span>

                <span class="rpg-gold">
                    ● ${d.gold.toLocaleString('vi-VN')} vàng
                </span>
            </div>
        `;

        this.root.querySelector('.rpg-nav').innerHTML = [
            ['inventory', 'Túi đồ', 'B'],
            ['quests', 'Nhiệm vụ', 'J']
        ].map(([id, name, key]) => `
            <button
                type="button"
                data-action="tab"
                data-id="${id}"
                aria-label="${name} (${key})"
            >
                <span>${name}</span>
                <kbd>${key}</kbd>

                ${
                    id === 'quests' &&
                    s.explorationReady &&
                    !d.explorationClaimed
                        ? '<i class="rpg-dot"></i>'
                        : ''
                }
            </button>
        `).join('');

        if (this.tab) this.renderModal();
    }

    openShop(npc) {
        if (
            !npc?.isMerchant ||
            this.scene.dialogue?.nearest() !== npc
        ) {
            return;
        }

        this.shopNPC = npc;
        this.shopCategory = 'all';
        this.shopLevel = 0;

        this.toggle('shop');
    }

    toggle(tab) {
        if (
            tab === 'shop' &&
            (
                !this.shopNPC ||
                this.scene.dialogue?.nearest() !== this.shopNPC
            )
        ) {
            return;
        }

        if (this.scene.dialogue?.isOpen) {
            this.toast('Kết thúc hội thoại để mở menu.');
            return;
        }

        if (this.tab === tab) {
            this.close();
            return;
        }

        if (!this.tab) {
            this.previousFocus = document.activeElement;

            this.keyboardWasEnabled =
                this.scene.input.keyboard.enabled;

            this.scene.input.keyboard.enabled = false;
            this.scene.input.keyboard.resetKeys();
        }

        this.tab = tab;
        this.overlay.hidden = false;

        this.scene.player?.stop();
        this.scene.dialogueUI?.actionBar?.setVisible(false);

        this.renderModal();
        this.modal.querySelector('button')?.focus();
    }

    close() {
        if (!this.tab) return;

        this.tab = null;
        this.shopNPC = null;
        this.previewId = null;
        this.overlay.hidden = true;

        this.scene.input.keyboard.resetKeys();

        this.scene.input.keyboard.enabled =
            this.keyboardWasEnabled;

        if (!this.scene.dialogue?.isOpen) {
            this.scene.dialogueUI?.actionBar?.setVisible(true);
        }

        if (this.previousFocus?.isConnected) {
            this.previousFocus.focus();
        }
    }

    renderModal() {
        const focus = document.activeElement?.closest('button');

        const focusWasInside = Boolean(
            focus && this.modal.contains(focus)
        );

        const focusAction = focus?.dataset.action;
        const focusId = focus?.dataset.id;
        const scrollTop = this.modal.scrollTop;

        const names = {
            inventory: 'Túi đồ & Trang bị',
            quests: 'Nhật ký nhiệm vụ'
        };

        if (this.shopNPC) names.shop = 'Cửa hàng';

        this.modal.classList.toggle(
            'rpg-shop-modal',
            this.tab === 'shop'
        );

        this.modal.classList.toggle(
            'rpg-inventory-modal',
            this.tab === 'inventory'
        );

        this.modal.innerHTML = `
            <header class="rpg-modal-header">
                <h2 id="rpg-modal-title">
                    ${names[this.tab] ?? ''}
                </h2>

                <button
                    type="button"
                    data-action="close"
                    aria-label="Đóng menu"
                >
                    ✕ <small>Esc</small>
                </button>
            </header>

            <div class="rpg-tabs">
                ${Object.entries(names).map(([id, name]) => `
                    <button
                        type="button"
                        data-action="tab"
                        data-id="${id}"
                        class="${id === this.tab ? 'active' : ''}"
                    >
                        ${name}
                    </button>
                `).join('')}
            </div>

            ${this.content()}
        `;

        this.drawCharacterPreview();

        if (focusWasInside && focusAction) {
            const replacement = [
                ...this.modal.querySelectorAll('button')
            ].find(button => (
                button.dataset.action === focusAction &&
                button.dataset.id === focusId
            ));

            (
                replacement ??
                this.modal.querySelector('[data-action="close"]')
            )?.focus({ preventScroll: true });
        }

        this.modal.scrollTop = scrollTop;
    }

    content() {
        if (this.tab === 'inventory') {
            return this.inventoryContent();
        }

        if (this.tab === 'shop') {
            return this.shopContent();
        }

        if (this.tab === 'quests') {
            return this.questContent();
        }

        return '';
    }

    /*
     * inventory hiện tại lưu tổng số đồ sở hữu,
     * bao gồm đồ đang trang bị.
     *
     * Số đồ trong balo = tổng sở hữu - số đang mặc.
     * Không trừ trực tiếp dữ liệu để tránh làm sai
     * useItem(), canBuy() và dữ liệu lưu hiện tại.
     */
    bagQuantity(id) {
        const d = this.state.data;

        const worn = Object.values(d.equipment)
            .filter(value => value === id)
            .length;

        return Math.max(
            0,
            (Number(d.inventory[id]) || 0) - worn
        );
    }

    gearStats(item) {
        return [
            item.attack && `+${item.attack} công`,
            item.defense && `+${item.defense} thủ`,
            item.maxHP && `+${item.maxHP} HP`,
            item.maxMP && `+${item.maxMP} MP`
        ].filter(Boolean).join(' · ');
    }

    inventoryContent() {
        const s = this.state;
        const d = s.data;

        // Chỉ hiện đồ chưa được trang bị trong balo.
        const ids = Object.keys(ITEMS).filter(
            id => this.bagQuantity(id) > 0
        );

        if (!ids.includes(this.selected)) {
            this.selected = ids[0] ?? null;
        }

        if (
            this.previewId &&
            !ids.includes(this.previewId)
        ) {
            this.previewId = null;
        }

        const item = ITEMS[this.selected];
        const previewItem = ITEMS[this.previewId];

        const equipmentHTML = EQUIPMENT_SLOTS.map(
            ([slot, name, frame]) => {
                const id = d.equipment[slot];
                const value = ITEMS[id];

                const placeholder = frame === null
                    ? { icon: slot, level: 1 }
                    : { frame };

                return `
                    <div
                        class="rpg-equipment-slot ${
                            value ? 'equipped' : ''
                        }"
                    >
                        <div class="rpg-equipment-header">
                            ${itemIcon(value ?? placeholder, 32)}

                            <div>
                                <div class="rpg-equipment-title">
                                    ${escape(name)}
                                </div>

                                <div
                                    class="rpg-equipment-name ${
                                        value
                                            ? ''
                                            : 'rpg-equipment-empty'
                                    }"
                                >
                                    ${escape(
                                        value?.name ??
                                        'Chưa trang bị'
                                    )}
                                </div>
                            </div>
                        </div>

                        ${value ? `
                            <div class="rpg-equipment-stats">
                                ${this.gearStats(value)}
                            </div>

                            <div class="rpg-equipment-footer">
                                <span class="rpg-tier">
                                    CẤP ${value.level ?? 1}
                                </span>

                                <button
                                    type="button"
                                    data-action="unequip"
                                    data-id="${escape(id)}"
                                >
                                    Tháo
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
            }
        ).join('');

        // Tự tăng số ô nếu có nhiều hơn 24 loại vật phẩm.
        const capacity = Math.max(
            24,
            Math.ceil(ids.length / 6) * 6
        );

        const bagHTML = Array.from(
            { length: capacity },
            (_, index) => {
                const id = ids[index];
                const value = ITEMS[id];

                if (!value) {
                    return `
                        <div
                            class="rpg-slot empty"
                            aria-hidden="true"
                        ></div>
                    `;
                }

                const quantity = this.bagQuantity(id);

                return `
                    <button
                        type="button"
                        class="rpg-slot ${
                            id === this.selected ? 'selected' : ''
                        }"
                        data-action="select"
                        data-id="${escape(id)}"
                        aria-label="${
                            escape(value.name)
                        }, số lượng ${quantity}"
                        aria-pressed="${id === this.selected}"
                    >
                        ${itemIcon(value, 36)}

                        <span class="rpg-qty">
                            ${quantity}
                        </span>
                    </button>
                `;
            }
        ).join('');

        const canPreview = item && [
            'weapon',
            'shield'
        ].includes(item.type);

        return `
            <div class="rpg-bag-layout">
                <section class="rpg-equipment-panel">
                    <div class="rpg-section-heading">
                        <h3>Lữ khách</h3>
                        <span>Trang bị hiện tại</span>
                    </div>

                    <div class="rpg-model-stage">
                        <span class="rpg-model-caption">
                            ${
                                previewItem
                                    ? 'ĐANG THỬ ĐỒ'
                                    : 'NHÂN VẬT CỦA BẠN'
                            }
                        </span>

                        <span class="rpg-model-level">
                            LV ${d.level}
                        </span>

                        <canvas
                            class="rpg-character-preview"
                            width="480"
                            height="360"
                            role="img"
                            aria-label="Mô hình nhân vật với vũ khí và khiên"
                        ></canvas>

                        <div class="rpg-model-controls">
                            <button
                                type="button"
                                data-action="preview-turn"
                            >
                                Đổi hướng
                            </button>

                            ${previewItem ? `
                                <button
                                    type="button"
                                    data-action="preview-reset"
                                >
                                    Hủy thử
                                </button>
                            ` : ''}
                        </div>
                    </div>

                    ${previewItem ? `
                        <p class="rpg-subtle">
                            Đang thử:
                            ${escape(previewItem.name)}.
                            Bấm Trang bị để mặc.
                        </p>
                    ` : ''}

                    <div class="rpg-equipment-grid">
                        ${equipmentHTML}
                    </div>

                    <div class="rpg-summary-stats">
                        <div>
                            <span>TẤN CÔNG</span>
                            <strong>${s.attack}</strong>
                        </div>

                        <div>
                            <span>PHÒNG THỦ</span>
                            <strong>${s.defense}</strong>
                        </div>

                        <div>
                            <span>HP TỐI ĐA</span>
                            <strong>${s.maxHP}</strong>
                        </div>
                    </div>
                </section>

                <section class="rpg-bag-panel">
                    <div class="rpg-section-heading">
                        <h3>Ba lô</h3>
                        <span>${ids.length} / ${capacity} ô</span>
                    </div>

                    <div class="rpg-grid">
                        ${bagHTML}
                    </div>

                    ${item ? `
                        <article class="rpg-item-detail">
                            <header>
                                ${itemIcon(item, 48)}

                                <div>
                                    <h4>${escape(item.name)}</h4>

                                    <div class="rpg-tier">
                                        CẤP ${item.level ?? 1}
                                        · Có ${
                                            this.bagQuantity(
                                                this.selected
                                            )
                                        }
                                    </div>
                                </div>
                            </header>

                            <p>
                                ${escape(item.description)}
                            </p>

                            ${this.gearStats(item) ? `
                                <p class="rpg-tier">
                                    ${this.gearStats(item)}
                                </p>
                            ` : ''}

                            <div class="rpg-item-actions">
                                ${canPreview ? `
                                    <button
                                        type="button"
                                        data-action="preview"
                                    >
                                        Thử đồ
                                    </button>
                                ` : ''}

                                <button
                                    type="button"
                                    class="rpg-primary"
                                    data-action="use"
                                >
                                    ${
                                        item.type === 'consumable'
                                            ? 'Sử dụng'
                                            : 'Trang bị'
                                    }
                                </button>
                            </div>
                        </article>
                    ` : `
                        <div class="rpg-empty-bag">
                            Ba lô đang trống.
                            <br>
                            Tháo trang bị hoặc mua thêm
                            vật phẩm từ thương nhân.
                        </div>
                    `}
                </section>
            </div>

            <div class="rpg-bag-footer">
                <span>
                    Mặc đồ để chuyển vào ô trang bị
                    · Tháo đồ để trả về ba lô
                </span>

                <span>
                    ● ${d.gold.toLocaleString('vi-VN')} vàng
                </span>
            </div>
        `;
    }

    drawCharacterPreview() {
        const canvas = this.modal.querySelector(
            '.rpg-character-preview'
        );

        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;

        const player = this.scene.player;
        const sprite = player?.sprite;

        // Bản sao để thử đồ không thay đổi trang bị thật.
        const equipment = {
            ...this.state.data.equipment
        };

        const trying = ITEMS[this.previewId];

        if (
            trying &&
            ['weapon', 'shield'].includes(trying.type)
        ) {
            equipment[trying.type] = this.previewId;
        }

        const weaponFrames = {
            iron_sword: 103,
            iron_sword_2: 104,
            iron_sword_3: 105,
            iron_sword_4: 106,
            iron_sword_5: 107,
            wood_staff: 129
        };

        const shieldFrames = {
            round_shield: 102,
            round_shield_2: 101,
            round_shield_3: 102,
            round_shield_4: 101,
            round_shield_5: 102
        };

        const getFrame = number => {
            if (
                number == null ||
                !this.scene.textures.exists('dungeon')
            ) {
                return null;
            }

            return this.scene.textures.getFrame(
                'dungeon',
                number
            );
        };

        const draw = (
            frame,
            x,
            y,
            scale,
            flip = false
        ) => {
            const source = frame?.source?.image;

            if (
                !source ||
                !frame.cutWidth ||
                !frame.cutHeight
            ) {
                return false;
            }

            ctx.save();
            ctx.translate(x, y);

            if (flip) ctx.scale(-1, 1);

            ctx.drawImage(
                source,
                frame.cutX,
                frame.cutY,
                frame.cutWidth,
                frame.cutHeight,
                -frame.cutWidth * scale / 2,
                -frame.cutHeight * scale / 2,
                frame.cutWidth * scale,
                frame.cutHeight * scale
            );

            ctx.restore();

            return true;
        };

        const weaponFrame =
            player?.getWeaponFrame?.(equipment.weapon) ??
            weaponFrames[equipment.weapon] ??
            null;

        const shieldFrame =
            player?.getShieldFrame?.(equipment.shield) ??
            shieldFrames[equipment.shield] ??
            null;

        const direction = this.previewLeft ? -1 : 1;

        const scale = 7;
        const x = 240;
        const y = 176;

        const worldScale = Math.abs(sprite?.scaleX) || 3;

        // Khoảng cách vũ khí/khiên tương ứng offset 18
        // của Player trong bản đồ.
        const gap = 18 * scale / worldScale;

        const drawWeapon = () => draw(
            getFrame(weaponFrame),
            x + direction * gap,
            y + 6 * scale / worldScale,
            scale,
            this.previewLeft
        );

        const drawShield = () => draw(
            getFrame(shieldFrame),
            x - direction * gap,
            y + scale / worldScale,
            scale,
            this.previewLeft
        );

        // Bóng dưới chân.
        ctx.fillStyle = '#00000044';
        ctx.beginPath();
        ctx.ellipse(
            x,
            y + 60,
            65,
            15,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Vẽ món nằm sau nhân vật trước.
        if (this.previewLeft) {
            drawWeapon();
        } else {
            drawShield();
        }

        // Lấy đúng sprite nhân vật đang dùng trong scene.
        const rendered = draw(
            sprite?.frame ?? getFrame(96),
            x,
            y,
            scale,
            this.previewLeft
        );

        // Vẽ món nằm trước nhân vật sau.
        if (this.previewLeft) {
            drawShield();
        } else {
            drawWeapon();
        }

        if (!rendered) {
            ctx.fillStyle = '#d9b66c';
            ctx.font = '22px Arial';
            ctx.textAlign = 'center';

            ctx.fillText(
                'Chưa tải hình nhân vật',
                x,
                y
            );
        }
    }

    shopContent() {
        const s = this.state;
        const d = s.data;

        const ids = SHOP_ITEMS.filter(id => (
            (
                this.shopCategory === 'all' ||
                ITEMS[id].category === this.shopCategory
            ) &&
            (
                !this.shopLevel ||
                ITEMS[id].level === this.shopLevel
            )
        ));

        const categories = [
            ['all', 'Tất cả'],
            ['weapon', 'Vũ khí'],
            ['gear', 'Khiên & giáp'],
            ['hp', 'Bình máu'],
            ['mp', 'Bình mana']
        ];

        return `
            <div class="rpg-shop-gold">
                <strong>
                    ${escape(
                        this.shopNPC?.name ?? 'Thương nhân'
                    )}
                </strong>

                <span>
                    ● ${d.gold.toLocaleString('vi-VN')} vàng
                </span>
            </div>

            <div
                class="rpg-shop-filters"
                aria-label="Loại vật phẩm"
            >
                ${categories.map(([id, label]) => `
                    <button
                        type="button"
                        data-action="filter"
                        data-id="${id}"
                        class="${
                            this.shopCategory === id
                                ? 'active'
                                : ''
                        }"
                    >
                        ${label}
                    </button>
                `).join('')}
            </div>

            <div
                class="rpg-shop-filters"
                aria-label="Cấp vật phẩm"
            >
                ${[0, 1, 2, 3, 4, 5].map(level => `
                    <button
                        type="button"
                        data-action="tier"
                        data-id="${level}"
                        class="${
                            this.shopLevel === level
                                ? 'active'
                                : ''
                        }"
                    >
                        ${level ? 'Cấp ' + level : 'Mọi cấp'}
                    </button>
                `).join('')}
            </div>

            <div class="rpg-subtle">
                Cấp vật phẩm thể hiện sức mạnh,
                không yêu cầu cấp nhân vật.
                Mua xong, mở Ba lô để dùng hoặc trang bị.
            </div>

            <div class="rpg-shop-grid">
                ${ids.map(id => {
                    const item = ITEMS[id];
                    const check = s.canBuy(id);

                    const buttonLabel = check.ok
                        ? 'Mua 1'
                        : item.maxStack === 1 &&
                            d.inventory[id]
                            ? 'Đã sở hữu'
                            : check.message;

                    return `
                        <article class="rpg-shop-item">
                            <header>
                                ${itemIcon(item, 44)}

                                <div>
                                    <h3>${escape(item.name)}</h3>

                                    <span class="rpg-tier">
                                        CẤP ${item.level}
                                        · Đang có:
                                        ${d.inventory[id] ?? 0}
                                    </span>
                                </div>
                            </header>

                            <p class="rpg-subtle">
                                ${escape(item.description)}
                            </p>

                            <div class="rpg-shop-buy">
                                <strong>
                                    ● ${item.price} vàng
                                </strong>

                                <button
                                    type="button"
                                    data-action="buy"
                                    data-id="${escape(id)}"
                                    ${
                                        check.ok
                                            ? 'class="rpg-primary"'
                                            : 'disabled'
                                    }
                                    title="${escape(check.message)}"
                                >
                                    ${escape(buttonLabel)}
                                </button>
                            </div>
                        </article>
                    `;
                }).join('')}
            </div>
        `;
    }

    questContent() {
        const s = this.state;
        const d = s.data;

        return `
            <article class="rpg-quest">
                <h3>Những bước chân đầu tiên</h3>

                <p class="rpg-subtle">
                    Khám phá ba khu vực bằng các cổng
                    dịch chuyển.
                </p>

                <ul>
                    ${DESTINATIONS.map(([id, name]) => `
                        <li
                            class="${
                                d.visited.includes(id)
                                    ? 'done'
                                    : ''
                            }"
                        >
                            ${
                                d.visited.includes(id)
                                    ? '✓'
                                    : '○'
                            }
                            ${escape(name)}
                        </li>
                    `).join('')}
                </ul>

                <div class="rpg-rewards">
                    <span>120 EXP · 30 vàng</span>

                    <button
                        type="button"
                        class="rpg-primary"
                        data-action="claim"
                        ${
                            !s.explorationReady ||
                            d.explorationClaimed
                                ? 'disabled'
                                : ''
                        }
                    >
                        ${
                            d.explorationClaimed
                                ? 'Đã nhận thưởng'
                                : s.explorationReady
                                    ? 'Nhận thưởng'
                                    : `${d.visited.length}/3 khu vực`
                        }
                    </button>
                </div>
            </article>
        `;
    }

    syncDialogue(open) {
        this.root.classList.toggle('talking', open);
    }

    toast(message) {
        const node = this.root.querySelector('.rpg-toast');

        node.textContent = message;
        node.hidden = false;

        clearTimeout(this.toastTimer);

        this.toastTimer = setTimeout(() => {
            node.hidden = true;
        }, 2800);
    }

    destroy() {
        if (this.destroyed) return;

        this.close();
        this.destroyed = true;

        this.unsubscribe();
        clearTimeout(this.toastTimer);

        window.removeEventListener('keydown', this.onKey);
        this.root.removeEventListener('click', this.onClick);
        this.root.remove();
    }
}
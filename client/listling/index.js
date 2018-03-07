/*
 * Open Listling
 * Copyright (C) 2018 Open Listling contributors
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the
 * GNU Affero General Public License as published by the Free Software Foundation, either version 3
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with this program.
 * If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Open Listling UI.
 */

"use strict";

window.listling = {};

/**
 * TODO
 */
micro.bind.transforms.render = function(ctx, template, defaultContent) {
    if (typeof template === "string") {
        template = document.querySelector(template);
    }
    if (!template) {
        console.log("defaultcontent");
        return defaultContent;
    }
    let elem = document.importNode(template.content, true);
    micro.bind.bind(elem, ctx.data);
    return elem;
};

/**
 * TODO.
 */
micro.ListInput = class extends HTMLElement {
    createdCallback() {
        this.appendChild(
            document.importNode(document.querySelector("#micro-list-input-template").content,
                                true));
        this._data = new micro.bind.Watchable({
            value: new micro.bind.Watchable([]),
            //value: [],
            options: ["Hallo", "Lustig", "Ja"],
            currentOptions: ["Hallo", "Lustig", "Ja"],
            template: this.querySelector("micro-list-input > template"),
            text: "",

            /*micro.bind.concat(arr, other) {
                let concated = new micro.bind.Watchable([]);
                arr.watch(Symbol("+"), (prop, i) => concated.splice(i, 0, arr[i]));
                arr.watch(Symbol("-"), (prop, i) => concated.splice(i, 1));
                arr.watch(Symbol("*"), (prop, i) => concated[i] = arr[i]);
                other.watch(Symbol("+"), (prop, i) => concated.splice(i + arr.length, 0, other[i]));
                other.watch(Symbol("-"), (prop, i) => concated.splice(i + arr.length, 1));
                other.watch(Symbol("*"), (prop, i) => concated[i + arr.length] = other[i]);
                return concated;
            },

            micro.bind.filter(arr, callback, refresh) {
                // ...
                function r() {
                    arr.forEach(i, value => onStar(i, value));
                }
                refresh.watch(Symbol("+"), r);
                refresh.watch(Symbol("-"), r);
                refresh.watch(Symbol("*"), r);
                // ...
            },*/

            /*
                this._data.currentOptions = micro.bind.concat(
                    this._data.textAmend,
                    micro.bind.filter(arr, option => !this._data.value.includes(option), this._data.value));
                // onchange
                if (value.includes(text) {
                    textAmend.pop();
                } else {
                    textAmend.splice(0, 1, text);
                }
            */

            add: item => {
                let input = this.querySelector("input");
                input.value = "";
                this._data.text = "";
                setTimeout(() => input.focus()); // XXX

                this._data.value.push(item);
                this._compileOptions();
            },

            remove: item => {
                this._data.value.splice(this._data.value.indexOf(item), 1);
                this._compileOptions();
                this.querySelector("input").focus();
            },

            updateText: event => {
                this._data.text = event.target.value;
                this._compileOptions();
            },

            handleKeys: event => {
                switch(event.key) {
                case "Enter":
                case "Tab":
                    if (this._data.text) {
                        event.preventDefault();
                        this._data.add(this._data.text);
                    }
                    break;
                case "Backspace":
                    if (event.target.selectionStart === 0) {
                        // let item = this._data.value.pop(); TODO
                        let [item] = this._data.value.splice(this._data.value.length - 1, 1);
                        if (item) {
                            event.target.value = item;
                            this._data.text = item;
                        }
                        this._compileOptions();
                    }
                    break;
                }
            }
        });
        micro.bind.bind(this.children, this._data);
        this.classList.add("micro-input-wrapper");
    }

    get value() {
        this._data.value;
    }

    set value(value) {
        this._data.value = new micro.bind.Watchable(value.slice());
        this._compileOptions();
    }

    _compileOptions() {
        let arr = this._data.options.filter(
            o => o.includes(this._data.text) && !this._data.value.includes(o));
        /*if (this._data.text && !this._data.value.includes(this._data.text)) {
            arr.unshift(this._data.text);
        }*/
        this._data.currentOptions = arr;
    }
};
document.registerElement("micro-list-input", micro.ListInput);

            /*key: item => item,
            make: text => text,*/
    /*set options(value) {
        this._data.options = value;
        this.classList.toggle("micro-list-input-has-options", value && value.length > 0);
    }

    set key(value) {
        this._data.key = value;
    }

    set make(value) {
        this._data.make = value;
    }*/

                    /*// TODO: filter options on change event and use directly in template (so we can also
                    // use it here)
                    let item = this._data.filterOptions(this._data.options, this._data.text, this._data.key)[0];
                    if (item) {
                        this._data.add();
                    }*/
            // data-onchange="updateText"
            /*updateText: event => {
                this._data.text = event.target.value;
            },*/
            /*compileOptions: (arr, text, key) => {
                arr = arr.filter(item => {
                    let itemKey = key(item);
                    return itemKey.includes(text) &&
                           !this._data.value.find(other => key(other) === itemKey);
                });
                if (text && !arr.find(item => key(item) === text)) {
                    arr.unshift(make(text));
                }
                return arr;
            },*/

    // data-onfocus="focus"
    /*focus: () => {
        this.classList.add("micro-input-wrapper-focus");
    }
    blur: () => {
        this.classList.remove("micro-input-wrapper-focus");
    }*/
    //this.onclick = this.focus.bind(this);
    /*focus() {
        this.querySelector("input").focus();
    }*/

listling.makeListURL = function(ctx, lst) {
    if (lst === undefined) {
        [ctx, lst] = [undefined, ctx];
    }
    return `/lists/${lst.id.split(":")[1]}${micro.util.slugify(lst.title)}`;
};

/**
 * Open Listling UI.
 */
listling.UI = class extends micro.UI {
    init() {
        function makeAboutPage() {
            return document
                .importNode(ui.querySelector(".listling-about-page-template").content, true)
                .querySelector("micro-about-page");
        }

        this.pages = this.pages.concat([
            {url: "^/$", page: "listling-start-page"},
            {url: "^/about$", page: makeAboutPage},
            {url: "^/lists/([^/]+)(?:/[^/]+)?$", page: listling.ListPage.make}
        ]);

        Object.assign(this.renderEvent, {
            "create-list"(event) {
                let elem = document.importNode(
                    ui.querySelector(".listling-create-list-event-template").content, true);
                micro.bind.bind(elem, {event, makeListURL: listling.makeListURL});
                return elem;
            }
        });
    }
};

/**
 * Start page.
 */
listling.StartPage = class extends micro.Page {
    createdCallback() {
        const USE_CASES = [
            {id: "todo", title: "To-Do list", icon: "check"},
            {id: "shopping", title: "Shopping list", icon: "shopping-cart"},
            {id: "meeting-agenda", title: "Meeting agenda", icon: "handshake-o"},
            {id: "simple", title: "Simple list", icon: "list"}
        ];

        super.createdCallback();
        this.appendChild(
            document.importNode(ui.querySelector(".listling-start-page-template").content, true));
        this._data = new micro.bind.Watchable({
            settings: ui.settings,
            useCases: USE_CASES,
            selectedUseCase: USE_CASES[0],

            focusUseCase(event) {
                event.target.focus();
            },

            selectUseCase: useCase => {
                // On touch, a mouseenter and a click event are triggered. Delay selecting the use
                // case on mouseenter, so the click cannot interact with child elements becoming
                // visible.
                setTimeout(() => {
                    this._data.selectedUseCase = useCase;
                }, 0);
            },

            createList: async useCase => {
                let list = await micro.call("POST", "/api/lists", {use_case: useCase.id, v: 2});
                ui.navigate(`/lists/${list.id.split(":")[1]}`);
            },

            createExample: async useCase => {
                let list = await micro.call("POST", "/api/lists/create-example",
                                            {use_case: useCase.id});
                ui.navigate(`/lists/${list.id.split(":")[1]}`);
            }
        });
        micro.bind.bind(this.children, this._data);
    }

    attachedCallback() {
        ui.shortcutContext.add("S", () => {
            this.querySelector(".listling-selected .listling-start-create-list").click();
        });
        ui.shortcutContext.add("E", () => {
            if (this._data.selectedUseCase.id !== "simple") {
                this.querySelector(".listling-selected .listling-start-create-example button")
                    .click();
            }
        });
    }

    detachedCallback() {
        ui.shortcutContext.remove("S");
        ui.shortcutContext.remove("E");
    }
};

listling.ListPage = class extends micro.Page {
    static async make(url, id) {
        let page = document.createElement("listling-list-page");
        if (id !== "new") {
            page.list = await micro.call("GET", `/api/lists/List:${id}`);
        }
        return page;
    }

    createdCallback() {
        super.createdCallback();
        this.appendChild(
            document.importNode(ui.querySelector(".listling-list-page-template").content, true));
        this._data = new micro.bind.Watchable({
            lst: null,
            presentItems: null,
            trashedItems: null,
            trashedItemsCount: 0,
            editMode: true,
            trashExpanded: false,
            creatingItem: false,
            settingsExpanded: false,
            toggleTrash: () => {
                this._data.trashExpanded = !this._data.trashExpanded;
            },
            startCreateItem: () => {
                this._data.creatingItem = true;
                this.querySelector(".listling-list-create-item form").elements[1].focus();
            },
            stopCreateItem: () => {
                this._data.creatingItem = false;
            },
            toggleSettings: () => {
                this._data.settingsExpanded = !this._data.settingsExpanded;
            },

            startEdit: () => {
                this._data.editMode = true;
                this._form.elements[0].focus();
            },

            edit: async() => {
                let url = this._data.lst ? `/api/lists/${this._data.lst.id}` : "/api/lists";
                let list = await micro.call("POST", url, {
                    title: this._form.elements.title.value,
                    description: this._form.elements.description.value,
                    features: Array.from(this._form.elements.features, e => e.checked && e.value)
                        .filter(feature => feature)
                });
                if (this._data.lst) {
                    this.list = list;
                } else {
                    ui.navigate(`/lists/${list.id.split(":")[1]}`);
                }
            },

            cancelEdit: () => {
                if (this._data.lst) {
                    this._data.editMode = false;
                } else {
                    ui.navigate("/");
                }
            },

            moveItemDrag: event => {
                // NOTE: This may be better done by micro.OL itself if some reset attribute is set
                this.querySelector(".listling-list-items").insertBefore(event.detail.li,
                                                                        event.detail.from);
                let to = event.detail.to && event.detail.to.item;
                if (to) {
                    let i = this._data.presentItems.findIndex(item => item.id === to.id);
                    to = this._data.presentItems[i - 1] || null;
                } else {
                    to = this._data.presentItems[this._data.presentItems.length - 1];
                }
                this._moveItem(event.detail.li.item, to);
            },

            moveItemKey: event => {
                let ol = event.target.parentElement;
                let item = event.target.item;
                let i = this._data.presentItems.findIndex(other => other.id === item.id);

                let j = i + (event.detail.dir === "up" ? -2 : 1);
                if (j === -2 || j === this._data.presentItems.length) {
                    return;
                }
                let to = this._data.presentItems[j] || null;

                // Move, then refocus
                this._moveItem(item, to);
                ol.children[i + (event.detail.dir === "up" ? -1 : 1)].focus();
            }
        });
        micro.bind.bind(this.children, this._data);

        let updateClass = () => {
            this.classList.toggle("listling-list-has-trashed-items", this._data.trashedItemsCount);
            this.classList.toggle("listling-list-mode-view", !this._data.editMode);
            this.classList.toggle("listling-list-mode-edit", this._data.editMode);
            ["check", "assign"].forEach(feature => {
                this.classList.toggle(`listling-list-feature-${feature}`,
                                      this._data.lst && this._data.lst.features.includes(feature));
            });
        };
        ["lst", "editMode", "trashedItemsCount"].forEach(
            prop => this._data.watch(prop, updateClass));
        updateClass();

        this._items = null;
        this._form = this.querySelector("form");
        this._events = ["list-items-create", "list-items-move", "item-edit", "item-trash",
                        "item-restore", "item-check", "item-uncheck", "item-assign"];
    }

    async attachedCallback() {
        ui.shortcutContext.add("B", this._data.toggleTrash);
        ui.shortcutContext.add("S", this._data.toggleSettings);
        this._events.forEach(e => ui.addEventListener(e, this));
        if (this._data.editMode) {
            this._form.elements[0].focus();
        } else {
            let items = await micro.call("GET", `/api/lists/${this._data.lst.id}/items`);
            this._items = new micro.bind.Watchable(items);
            this._data.presentItems = micro.bind.filter(this._items, i => !i.trashed);
            this._data.trashedItems = micro.bind.filter(this._items, i => i.trashed);
            this._data.trashedItemsCount = this._data.trashedItems.length;
        }
    }

    detachedCallback() {
        ui.shortcutContext.remove("B");
        ui.shortcutContext.remove("S");
        this._events.forEach(e => ui.removeEventListener(e, this));
    }

    get list() {
        return this._data.lst;
    }

    set list(value) {
        this._data.lst = value;
        this._data.editMode = !this._data.lst;
        this.caption = this._data.lst.title;
        history.replaceState(null, null, listling.makeListURL(this._data.lst));
    }

    async handleEvent(event) {
        if (event.type === "list-items-create") {
            this._items.push(event.detail.item);
        } else if (event.type === "list-items-move") {
            let i = this._items.findIndex(item => item.id === event.detail.item.id);
            this._items.splice(i, 1);
            let j = event.detail.to
                ? this._items.findIndex(item => item.id === event.detail.to.id) + 1 : 0;
            this._items.splice(j, 0, event.detail.item);
        } else if (
            ["item-edit", "item-trash", "item-restore", "item-check", "item-uncheck", "item-assign"]
                .includes(event.type)) {
            let i = this._items.findIndex(item => item.id === event.detail.item.id);
            this._items[i] = event.detail.item;
            this._data.trashedItemsCount = this._data.trashedItems.length;
        }
    }

    async _moveItem(item, to) {
        ui.dispatchEvent(new CustomEvent("list-items-move", {detail: {item, to}}));
        await micro.call("POST", `/api/lists/${this._data.lst.id}/items/move`, {
            item_id: item.id,
            to_id: to && to.id
        });
    }
};

/**
 * TODO.
 */
listling.AssignNotification = class extends HTMLElement {
    createdCallback() {
        this.appendChild(
            document.importNode(ui.querySelector(".listling-assign-notification-template").content,
                                true));
        this._data = new micro.bind.Watchable({
            item: null,

            assign: async() => {
                let input = this._form.elements.names;
                let assignees = this._data.item.assignees.concat({id: null, name: input.value});
                input.value = "";
                let item = await micro.call(
                    "POST",
                    `/api/lists/${this._data.item.list_id}/items/${this._data.item.id}/assign`,
                    {names: assignees.map(u => u.name)});
                ui.dispatchEvent(new CustomEvent("item-assign", {detail: {item}}));
                this._data.close();
            },

            close: () => {
                this.remove();

                /* TODO: Move to micro */
                ui.querySelector("main").style.filter = "";
                ui.querySelector("main").style.pointerEvents = "";
            }
        });
        micro.bind.bind(this.children, this._data);
        this.classList.add("micro-notification");
        this._form = this.querySelector("form");
    }

    attachedCallback() {
        this._form.elements.names.focus();

        /* TODO: Move to micro */
        ui.querySelector("main").style.filter = "blur(1px) opacity(50%)";
        ui.querySelector("main").style.pointerEvents = "none";
    }

    get item() {
        return this._data.item;
    }

    set item(value) {
        this._data.item = value;
    }
}

Object.defineProperty(micro.UserElement.prototype, "user", {
	set(value) {
        this._user = value;
        if (this._user) {
            this.classList.toggle("micro-user-anonymous", !this._user.id);
            //let i = this.querySelector("i");
            //i.classList.toggle("fa-user", this._user.id);
            //i.classList.toggle("fa-user-o", !this._user.id);
            this.querySelector("span").textContent = this._user.name;
            this.setAttribute("title", this._user.name);
        }
    }
});

listling.ItemElement = class extends HTMLLIElement {
    createdCallback() {
        this.appendChild(
            document.importNode(ui.querySelector(".listling-item-template").content, true));
        this._data = new micro.bind.Watchable({
            item: null,
            editMode: true,

            startEdit: () => {
                this._data.editMode = true;
                this._form.elements[0].focus();
            },

            edit: async() => {
                let url = this._data.item
                    ? `/api/lists/${ui.page.list.id}/items/${this._data.item.id}`
                    : `/api/lists/${ui.page.list.id}/items`;
                let item = await micro.call("POST", url, {
                    title: this._form.elements.title.value,
                    text: this._form.elements.text.value
                });
                if (this._data.item) {
                    ui.dispatchEvent(new CustomEvent("item-edit", {detail: {item}}));
                } else {
                    this._form.reset();
                    ui.dispatchEvent(new CustomEvent("list-items-create", {detail: {item}}));
                }
                if (this.onedit) {
                    this.onedit(new CustomEvent("edit"));
                }
            },

            cancelEdit: () => {
                if (this._data.item) {
                    this._data.editMode = false;
                } else {
                    this._form.reset();
                }
                if (this.oncancel) {
                    this.oncancel(new CustomEvent("cancel"));
                }
            },

            trash: async() => {
                let item = await micro.call(
                    "POST", `/api/lists/${ui.page.list.id}/items/${this._data.item.id}/trash`);
                ui.dispatchEvent(new CustomEvent("item-trash", {detail: {item}}));
            },

            restore: async() => {
                let item = await micro.call(
                    "POST", `/api/lists/${ui.page.list.id}/items/${this._data.item.id}/restore`);
                ui.dispatchEvent(new CustomEvent("item-restore", {detail: {item}}));
            },

            check: async() => {
                let item = await micro.call(
                    "POST", `/api/lists/${ui.page.list.id}/items/${this._data.item.id}/check`);
                ui.dispatchEvent(new CustomEvent("item-check", {detail: {item}}));
            },

            uncheck: async() => {
                let item = await micro.call(
                    "POST", `/api/lists/${ui.page.list.id}/items/${this._data.item.id}/uncheck`);
                ui.dispatchEvent(new CustomEvent("item-uncheck", {detail: {item}}));
            },

            startAssign: () => {
                let notification = document.createElement("listling-assign-notification");
                notification.item = this._data.item;
                ui.notify(notification);
            }
        });
        micro.bind.bind(this.children, this._data);

        let updateClass = () => {
            this.classList.toggle("listling-item-trashed",
                                  this._data.item && this._data.item.trashed);
            this.classList.toggle("listling-item-checked",
                                  this._data.item && this._data.item.checked);
            this.classList.toggle("listling-item-assigned",
                                  this._data.item && this._data.item.assignees.length > 0);
            this.classList.toggle("listling-item-mode-view", !this._data.editMode);
            this.classList.toggle("listling-item-mode-edit", this._data.editMode);
        };
        this._data.watch("item", updateClass);
        this._data.watch("editMode", updateClass);
        updateClass();

        this.tabIndex = 0;
        this.shortcutContext = new micro.keyboard.ShortcutContext(this);
        let move = dir => micro.util.dispatchEvent(this, new CustomEvent("move", {detail: {dir}}));
        this.shortcutContext.add("Alt+ArrowUp", move.bind(null, "up"));
        this.shortcutContext.add("Alt+ArrowDown", move.bind(null, "down"));

        this._form = this.querySelector("form");
    }

    get item() {
        return this._data.item;
    }

    set item(value) {
        this._data.item = value;
        this._data.editMode = !this._data.item;
    }
};

document.registerElement("listling-ui", {prototype: listling.UI.prototype, extends: "body"});
document.registerElement("listling-start-page", listling.StartPage);
document.registerElement("listling-list-page", listling.ListPage);
document.registerElement("listling-item",
                         {prototype: listling.ItemElement.prototype, extends: "li"});
document.registerElement("listling-assign-notification", listling.AssignNotification);

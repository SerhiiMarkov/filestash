import { createElement, createRender } from "../lib/skeleton/index.js";
import rxjs, { effect } from "../lib/rx.js";
import { qs } from "../lib/dom.js";
import { loadCSS } from "../helpers/loader.js";
import WithShell from "../components/decorator_shell_filemanager.js"

import { getState$ } from "./filespage/ctrl_filesystem_state.js";
import componentFilesystem from "./filespage/ctrl_filesystem.js";
import componentSubmenu from "./filespage/ctrl_submenu.js";

import "../components/breadcrumb.js";

export default WithShell(function(render) {
    const $page = createElement(`
        <div class="component_page_filespage">
            <div is="frequent_access" class="hidden"></div>
            <div is="component_submenu"></div>
            <div is="component_filesystem"></div>
        </div>
    `);
    render($page);

    // feature1: errors
    effect(getState$().pipe(
        rxjs.map(({ error }) => error),
        rxjs.filter((error) => !!error),
    ));

    // feature2: render the filesystem
    componentFilesystem(createRender(qs($page, "[is=\"component_filesystem\"]")));

    // feature3: render the menubar
    componentSubmenu(createRender(qs($page, "[is=\"component_submenu\"]")))
});

export function init() {
    return Promise.all([
        loadCSS(import.meta.url, "./ctrl_filespage.css"),
        loadCSS(import.meta.url, "../components/decorator_shell_filemanager.css"),
        loadCSS(import.meta.url, "./filespage/ctrl_filesystem.css"),
        loadCSS(import.meta.url, "./filespage/thing.css"),
        loadCSS(import.meta.url, "./filespage/ctrl_submenu.css"),
    ]);
}

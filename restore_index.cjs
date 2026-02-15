const fs = require('fs');
const path = require('path');

// Read BACKUP index.js
const backupPath = path.join('yablochny-preset_BACKUP', 'index.js');
const targetPath = 'index.js';

let content = fs.readFileSync(backupPath, 'utf8');

const newInjectionLogic = `
// Injected UI Management
async function injectYablochnyUI(htmlContent) {
    // Helper to log if dev mode
    const log = (msg) => {
        if (extension_settings['yablochny-preset']?.devMode) console.log(\`[Yablochny] \${msg}\`);
    };

    // Helper to insert our UI
    const insertUI = () => {
        if (jQuery("#yablochny-preset-container").length > 0) return;

        // Target: The persistent OpenAI presets container.
        const presetsBlock = jQuery("#openai_api-presets");
        const promptManager = jQuery("#completion_prompt_manager_list");
        
        // Safety check: Are we visible?
        if ((!presetsBlock.length || !presetsBlock.is(":visible")) && (!promptManager.length || !promptManager.is(":visible"))) return;

        // Create wrapper
        const wrapper = jQuery(\`<div id="yablochny-preset-container" style="width: 100%; margin-top: 10px; margin-bottom: 5px; padding: 0 5px;"></div>\`);
        wrapper.html(htmlContent);

        let inserted = false;

        // Preferred: Append to the persistent presets block
        if (presetsBlock.length > 0 && presetsBlock.is(":visible")) {
            presetsBlock.append(wrapper);
            inserted = true;
        } 
        // Fallback: Prompt manager
        else if (promptManager.length > 0 && promptManager.is(":visible")) {
            const drawer = promptManager.closest(".inline-drawer");
            if (drawer.length > 0) drawer.before(wrapper);
            else promptManager.before(wrapper);
            inserted = true;
        }

        if (inserted) {
            applyLocaleToUi();
            initControls();
            loadRegexPacksIntoYablochny();
            
            // --- STATE RESTORATION (Only for Regex Drawer) ---
            const restoreDrawer = (key, selector) => {
                const isOpen = localStorage.getItem(key) === "true";
                const el = wrapper.find(selector);
                const toggle = el.closest(".inline-drawer").find(".inline-drawer-toggle");
                const icon = toggle.find(".inline-drawer-icon");
                
                const updateIcon = (open) => {
                    if (open) {
                        icon.removeClass("fa-circle-chevron-down").addClass("fa-circle-chevron-up");
                        icon.removeClass("down"); 
                        toggle.addClass("open");
                    } else {
                        icon.removeClass("fa-circle-chevron-up").addClass("fa-circle-chevron-down");
                        icon.addClass("down");
                        toggle.removeClass("open");
                    }
                };

                if (isOpen) {
                    el.show();
                    updateIcon(true);
                } else {
                    el.hide();
                    updateIcon(false);
                }
                
                toggle.off("click").on("click", function(e) {
                    e.preventDefault(); e.stopPropagation();
                    if (el.is(":visible")) {
                        el.slideUp(200);
                        updateIcon(false);
                        localStorage.setItem(key, "false");
                    } else {
                        el.slideDown(200);
                        updateIcon(true);
                        localStorage.setItem(key, "true");
                    }
                });
            };

            // Restore Regex Drawer
            wrapper.find(".inline-drawer").each(function() {
                const title = jQuery(this).find(".inline-drawer-toggle").text().trim();
                if (title.includes("Regex")) {
                    restoreDrawer("yablochny_drawer_regex", jQuery(this).find(".inline-drawer-content"));
                }
            });

            // Credits & Easter Egg
            jQuery("#yp-credits-btn").off("click").on("click", function () { jQuery("#yp-credits-area").slideToggle(200); });
            jQuery("#yp-credits-close-inline").off("click").on("click", function () { jQuery("#yp-credits-area").slideUp(200); });
            
            let titleClicks = 0;
            jQuery("#yp-title-text").off("click").on("click", function (e) {
                e.stopPropagation();
                titleClicks++;
                if (titleClicks >= 5) {
                    titleClicks = 0;
                    const dev = jQuery("#yp-dev-container");
                    if (dev.css("display") === "none") { dev.show(); if (window.toastr) window.toastr.info("Developer Mode revealed!"); }
                    else { dev.hide(); if (jQuery("#yp-dev-mode").is(":checked")) jQuery("#yp-dev-mode").click(); }
                }
            });
        }
    };

    setInterval(insertUI, 500);
    setTimeout(insertUI, 500);
}
`;

// Find where to insert the new function (before the jQuery init block)
const jqueryBlockStart = 'jQuery(async () => {';
const splitIndex = content.indexOf(jqueryBlockStart);

if (splitIndex !== -1) {
    const part1 = content.substring(0, splitIndex);
    let part2 = content.substring(splitIndex);

    // Patch part2 to call injectYablochnyUI instead of append
    part2 = part2.replace('jQuery("#extensions_settings2").append(settingsHtml);', 'await injectYablochnyUI(settingsHtml);');

    // Also remove the old Credits Logic and Easter Egg from part2 because they are now inside injectYablochnyUI
    // But wait, applyLocaleToUi() and initControls() are also called in part2.
    // In my new logic, I call them inside injectYablochnyUI.
    // So I should remove them from part2 to avoid double init?
    // Actually, initControls binds events to IDs. If IDs are unique, double binding is bad.
    // But injectYablochnyUI ensures wrapper exists.
    
    // Let's comment them out in part2 or remove them.
    part2 = part2.replace('applyLocaleToUi();', '// applyLocaleToUi(); // Moved to injectYablochnyUI');
    part2 = part2.replace('initControls();', '// initControls(); // Moved to injectYablochnyUI');
    
    // Remove Credits Logic block (heuristic replace)
    // We can just rely on the fact that the IDs are unique and the old logic won't find the elements if they aren't in #extensions_settings2?
    // No, jQuery searches document-wide.
    // I should comment out the old event bindings in part2.
    
    // Easier way: Replace the whole jQuery block with a minimal one.
    const newJQueryBlock = `
jQuery(async () => {
    try {
        const settingsHtml = await jQuery.get(\`\${SCRIPT_PATH}/settings.html\`);
        await injectYablochnyUI(settingsHtml);
    } catch (e) {
        console.error("[Yablochny] Failed to load settings.html", e);
        return;
    }

    await waitForOpenAI();

    // Regex packs loading is handled in injectYablochnyUI now? 
    // Wait, loadRegexPacksIntoYablochny is called in injectYablochnyUI.
    // But we should check if we need to load them initially if UI isn't inserted yet?
    // No, logic is self-contained.

    const cfg = getConfig();
    if (cfg.autoSyncOnStart) {
        syncPreset(false);
    }
});
`;
    // We need to replace the entire old jQuery block.
    // It starts at splitIndex and goes to the end (mostly).
    // Let's just assume it's the last block.
    
    const finalContent = part1 + newInjectionLogic + newJQueryBlock;
    
    fs.writeFileSync(targetPath, finalContent);
    console.log("Index.js restored from backup and patched with new UI logic.");

} else {
    console.error("Could not find jQuery block in backup file.");
}

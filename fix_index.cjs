const fs = require('fs');
const content = fs.readFileSync('index.js', 'utf8');
const startMarker = 'async function injectYablochnyUI(htmlContent) {';
const endMarker = 'jQuery(async () => {';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const pre = content.substring(0, startIndex + startMarker.length);
    const post = content.substring(endIndex);
    const newBody = `
    // Helper to log if dev mode
    const log = (msg) => {
        if (extension_settings['yablochny-preset']?.devMode) console.log(\`[Yablochny] \${msg}\`);
    };

    // Helper to insert our UI
    const insertUI = () => {
        // Simple check: Does our container exist?
        const container = jQuery("#yablochny-preset-container");
        if (container.length > 0) {
            if (!container.is(":visible")) {
                if (container.parent().is(":visible")) {
                    container.show();
                }
            }
            return; 
        }

        // Target: The persistent OpenAI presets container.
        const presetsBlock = jQuery("#openai_api-presets");
        const promptManager = jQuery("#completion_prompt_manager_list");
        
        // Safety check: Are we visible?
        if ((!presetsBlock.length || !presetsBlock.is(":visible")) && (!promptManager.length || !promptManager.is(":visible"))) return;

        // Create wrapper - No padding needed as the drawer handles it
        const wrapper = jQuery(\`<div id="yablochny-preset-container" style="width: 100%; margin-top: 10px; margin-bottom: 5px;"></div>\`);
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
            
            // --- STATE RESTORATION ---
            const restoreDrawer = (key, selector) => {
                const isOpen = localStorage.getItem(key) === "true";
                const el = wrapper.find(selector);
                // Find the toggle button associated with this content
                // Usually it's the previous sibling .inline-drawer-toggle
                const toggle = el.closest(".inline-drawer").find(".inline-drawer-toggle").first();
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

            // Restore Main Drawer (Root)
            // Selector needs to find the content relative to wrapper
            // Wrapper -> .inline-drawer -> .inline-drawer-content (Main content)
            // But now we have multiple drawers. We need to be specific.
            // The first drawer is the Main one.
            const mainDrawerContent = wrapper.children(".inline-drawer").first().children(".inline-drawer-content");
            if (mainDrawerContent.length) {
                restoreDrawer("yablochny_main_drawer_open", mainDrawerContent);
            }

            // Restore Sub Drawers (Things, Regex, More Settings)
            // Look inside the main drawer content
            mainDrawerContent.find(".inline-drawer").each(function(i) {
                const subContent = jQuery(this).find(".inline-drawer-content");
                const title = jQuery(this).find(".inline-drawer-toggle").text().trim();
                
                let keySuffix = "sub_" + i;
                if (title.includes("Things")) keySuffix = "things";
                else if (title.includes("Regex")) keySuffix = "regex";
                else if (title.includes("More")) keySuffix = "more_settings";
                
                restoreDrawer("yablochny_drawer_" + keySuffix, subContent);
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

    // Use a fast polling interval
    setInterval(insertUI, 500);
    setTimeout(insertUI, 500);
}
`;
    fs.writeFileSync('index.js', pre + newBody + post);
    console.log("Fixed");
} else {
    console.log("Markers not found");
}

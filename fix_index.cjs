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

        // Target containers
        const promptManager = jQuery("#completion_prompt_manager_list");
        const settingsBlock = jQuery("#openai_settings");
        
        if (promptManager.length === 0 && settingsBlock.length === 0) return;

        // Create wrapper - CLEAN, no borders, full width
        const wrapper = jQuery(\`<div id="yablochny-preset-container" style="width: 100%; margin-top: 5px; margin-bottom: 5px;"></div>\`);
        wrapper.html(htmlContent);

        let inserted = false;

        // Strategy 1: Try to insert before Prompt Manager
        if (promptManager.length > 0) {
            const drawer = promptManager.closest(".inline-drawer");
            if (drawer.length > 0) {
                drawer.before(wrapper);
                inserted = true;
            } else {
                promptManager.before(wrapper);
                inserted = true;
            }
        } 
        
        // Fallback: Append to main settings
        if (!inserted && settingsBlock.length > 0) {
            settingsBlock.prepend(wrapper);
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
                const toggle = el.closest(".inline-drawer").find(".inline-drawer-toggle");
                const icon = toggle.find(".inline-drawer-icon");
                
                // Helper to update icon
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

            // Restore Main Drawer
            restoreDrawer("yablochny_main_drawer_open", ".yablochny-settings > .inline-drawer > .inline-drawer-content");

            // Restore Sub Drawers
            wrapper.find(".yablochny-settings .inline-drawer .inline-drawer-content .inline-drawer").each(function(i) {
                const subContent = jQuery(this).find(".inline-drawer-content");
                const title = jQuery(this).find(".inline-drawer-toggle").text().trim();
                let key = "yablochny_sub_" + i;
                
                if (title.includes("Things")) key = "yablochny_sub_things";
                else if (title.includes("Regex")) key = "yablochny_sub_regex";
                else if (title.includes("More")) key = "yablochny_sub_more";
                
                const toggle = jQuery(this).find(".inline-drawer-toggle");
                const icon = toggle.find(".inline-drawer-icon");
                
                const updateSubIcon = (open) => {
                    if (open) {
                        icon.removeClass("fa-circle-chevron-down").addClass("fa-circle-chevron-up");
                        icon.removeClass("down");
                    } else {
                        icon.removeClass("fa-circle-chevron-up").addClass("fa-circle-chevron-down");
                        icon.addClass("down");
                    }
                };

                if (localStorage.getItem(key) === "true") {
                    subContent.show();
                    updateSubIcon(true);
                } else {
                    subContent.hide();
                    updateSubIcon(false);
                }
                
                toggle.off("click").on("click", function(e) {
                    e.preventDefault(); e.stopPropagation();
                    if (subContent.is(":visible")) {
                        subContent.slideUp(200);
                        updateSubIcon(false);
                        localStorage.setItem(key, "false");
                    } else {
                        subContent.slideDown(200);
                        updateSubIcon(true);
                        localStorage.setItem(key, "true");
                    }
                });
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

    setInterval(insertUI, 1000);
    setTimeout(insertUI, 1000);
}

`;
    fs.writeFileSync('index.js', pre + newBody + post);
    console.log("Fixed");
} else {
    console.log("Markers not found");
}
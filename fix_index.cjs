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

        // Target: Insert into #rm_api_block, BEFORE #openai_settings.
        const mainContainer = jQuery("#rm_api_block");
        const settingsBlock = jQuery("#openai_settings");
        
        if (mainContainer.length === 0 || !mainContainer.is(":visible")) return;

        // Create wrapper - Flat structure needs padding
        const wrapper = jQuery(\`<div id="yablochny-preset-container" style="width: 100%; margin-bottom: 15px; padding: 0 5px;"></div>\`);
        wrapper.html(htmlContent);

        let inserted = false;

        if (settingsBlock.length > 0) {
            settingsBlock.before(wrapper);
            inserted = true;
        } else {
            mainContainer.prepend(wrapper);
            inserted = true;
        }

        if (inserted) {
            applyLocaleToUi();
            initControls();
            loadRegexPacksIntoYablochny();
            
            // --- STATE RESTORATION (Only for Regex Drawer now) ---
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
    fs.writeFileSync('index.js', pre + newBody + post);
    console.log("Fixed");
} else {
    console.log("Markers not found");
}

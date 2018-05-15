const process = require('process');

// https://twitter.com/amasad/status/983517998706077701?s=12
const IMAGE_URL = 'https://pbs.twimg.com/media/DaYoZrYU0AAIE8J.jpg';

module.exports = (Plugin, { Logger, CssUtils, WebpackModules, ReactComponents, VueInjector, Filters, Patcher, monkeyPatch, Api }, {Vue}) => class DownloadMoreRAM extends Plugin {
	onstart() {
        this.patchSidebarView();

        return CssUtils.injectSass(`.download-more-ram-container {
            h2 {
                color: #f6f6f7;
                text-transform: uppercase;
                margin-bottom: 20px;
                font-weight: 600;
                line-height: 20px;
                font-size: 16px;

                .theme-light & {
                    color: #4f545c;
                }
            }

            p {
                color: #b9bbbe;

                .theme-light & {
                    color: #4f545c;
                }
            }

            .download-more-ram-options {
                display: flex;
                margin: 20px -8px 20px 0;
            }

            .download-more-ram-option {
                display: flex;
                flex-direction: column;
                flex: 1 1;
                margin-right: 8px;
                border: 1px solid rgba(32, 34, 37, 0.6);
                border-radius: 5px;
                padding: 20px;
                text-align: center;

                .theme-light & {
                    border-color: hsla(210, 3%, 87%, 0.6);
                }

                &.disabled > * {
                    opacity: 0.6;
                }

                h2 {
                    margin-bottom: 8px;
                }

                p {
                    flex: 1 0;
                }

                .bd-button {
                    border-radius: 3px;
                    padding: 8px;
                    font-size: 16px;
                }
            }
        }`);
    }

    async patchSidebarView() {
        const selector = '.ui-standard-sidebar-view';
        const SidebarView = await ReactComponents.getComponent('SidebarView', {selector}, Filters.byPrototypeFields(['handleSetSection']));

        monkeyPatch(SidebarView.component.prototype).before('render', (component, args, retVal) => {
            if (!component.props.sections.find(s => s.section === 'ACCOUNT')) return;

            component.props.sections.splice(0, 0, {
                label: 'Important',
                section: 'HEADER'
            }, {
                label: 'Download More RAM',
                element: () => VueInjector.createReactElement({
                    components: this.components,
                    data: { plugin: this },
                    template: `<settings-panel />`
                }),
                section: 'DOWNLOADMORERAM'
            }, {section: 'DIVIDER'});
        });

        WebpackModules.getModuleByName('UserSettingsWindow').setSection('DOWNLOADMORERAM');
	}

	onstop() {
        Patcher.unpatchAll();
        WebpackModules.getModuleByName('UserSettingsWindow').setSection('ACCOUNT');
	}

    get components() {
        return this._components || module.exports.components(Vue, Api.CommonComponents, Api);
    }

    get api() {
        return Api;
    }
};

module.exports.components = (Vue, { Button }, Api) => {
    const components = {};

    const SettingsPanel = components.SettingsPanel = Vue.extend({
        components: { Button },
        data() {
            return {
                totalMemory: Math.round(process.getSystemMemoryInfo().total / 1000000)
            };
        },
        computed: {
            IMAGE_URL() { return IMAGE_URL }
        },
        methods: {
            download(gb) {
                this.totalMemory += gb;
                if (gb === 256) process.crash();
            }
        },
        template: `<div class="download-more-ram-container">
            <h2>Download More RAM</h2>
            <p><i>The best thing since Electron (not that hard though).</i></p>

            <div class="download-more-ram-options">
                <div class="download-more-ram-option disabled" v-if="totalMemory < 256">
                    <h2>{{ totalMemory < 1 ? totalMemory * 1000 + ' MB' : totalMemory + ' GB' }}</h2>
                    <p><i>That's nothing</i></p>
                </div>
                <div class="download-more-ram-option" v-if="totalMemory < 1">
                    <h2>1 GB</h2>
                    <p>What??? Have you got that awful Acer laptop?</p>
                    <Button @click="download(1)">Get</Button>
                </div>
                <div class="download-more-ram-option" v-if="totalMemory < 16">
                    <h2>16 GB</h2>
                    <p>Just talking to friends</p>
                    <Button @click="download(16)">Get</Button>
                </div>
                <div class="download-more-ram-option" v-if="totalMemory < 64">
                    <h2>64 GB</h2>
                    <p>A few servers</p>
                    <Button @click="download(64)">Get</Button>
                </div>
                <div class="download-more-ram-option" v-if="totalMemory < 128">
                    <h2>128 GB</h2>
                    <p>Video call with one other user</p>
                    <Button @click="download(128)">Get</Button>
                </div>
                <div class="download-more-ram-option" v-if="totalMemory < 256">
                    <h2>256 GB</h2>
                    <p><b><i>Super RAM download for max 10 large servers</i></b></p>
                    <Button v-tooltip="{content: '<i>Choosing this RAM download will crash Discord</i>', delay: {show: 200, hide: 0}}" @click="download(256)">Get</Button>
                </div>
                <div class="download-more-ram-option" v-if="totalMemory >= 256">
                    <h2>{{ totalMemory }} GB</h2>
                    <p><i>That's nothing</i></p>
                    <Button :disabled="true">You've still got no hope</Button>
                </div>
            </div>

            <h2>Why?</h2>
            <img :src="IMAGE_URL" />
        </div>`
    });

    return components;
};

import { viewport } from "./Viewport.mjs";
import { charFinder } from "./Finder/Char Finder.mjs";
import { players } from "./Player/Players.mjs";
import { wl } from "./WinnersLosers.mjs";
import { inside, stPath } from "./Globals.mjs";
import { getJson, saveJson } from "./File System.mjs";
import { gamemode } from "./Gamemode Change.mjs";
import { tournament } from "./Tournament.mjs";
import { teams } from "./Team/Teams.mjs";


class GuiSettings {

    #introCheck = document.getElementById("allowIntro");

    #forceWLCheck = document.getElementById('forceWLToggle');
    #scoreAutoCheck = document.getElementById("scoreAutoUpdate");
    #invertScoreCheck = document.getElementById("invertScore");

    #alwaysOnTopCheck = document.getElementById("alwaysOnTop");
    #resizableCheck = document.getElementById("resizableWindow");
    #lessZoomButt = document.getElementById("lessZoomButt");
    #moreZoomButt = document.getElementById("moreZoomButt");
    #zoomTextValue = document.getElementById("zoomTextValue");
    #zoomValue = 100;
    #restoreWindowButt = document.getElementById("restoreWindowButt");

    constructor() {

        // scoreboard listeners
        this.#introCheck.addEventListener("click", () => {
            this.save("allowIntro", this.isIntroChecked())
        });

        this.#forceWLCheck.addEventListener("click", () => {this.toggleForceWL()});
        this.#scoreAutoCheck.addEventListener("click", () => {
            this.save("scoreAutoUpdate", this.isScoreAutoChecked())
        });
        this.#invertScoreCheck.addEventListener("click", () => {
            this.save("invertScore", this.isInvertScoreChecked())
        });

        // dont forget about the copy match to clipboard button
        document.getElementById("copyMatch").addEventListener("click", () => {
            this.copyMatch();
        });

        // only electron cares about this
        if (inside.electron) {
            this.#setAlwaysOnTopListener();
            this.#setResizableListener();
            this.#lessZoomButt.addEventListener("click", () => {this.#lessZoom()})
            this.#moreZoomButt.addEventListener("click", () => {this.#moreZoom()})
            this.#restoreWindowButt.addEventListener("click", () => {
                this.#restoreWindowDefaults()
            });
        } else {
            document.getElementById("settingsElectron").style.display = "none";
        }

        // clicking the settings button will bring up the menu
        document.getElementById('settingsRegion').addEventListener("click", () => {
            viewport.toSettings();
        });

    }

    /** Loads all settings from the "GUI Settings.json" file */
    async load() {

        // get us the json file
        const guiSettings = await getJson(`${stPath.text}/GUI Settings`);

        // and update it all!
        this.#introCheck.checked = guiSettings.allowIntro;
        if (guiSettings.forceWL) this.#forceWLCheck.click();
        this.#scoreAutoCheck.checked = guiSettings.scoreAutoUpdate;
        this.#invertScoreCheck.checked = guiSettings.invertScore;

        if (inside.electron) {
            this.#alwaysOnTopCheck.checked = guiSettings.alwaysOnTop;
            this.toggleAlwaysOnTop();
            this.#resizableCheck.checked = guiSettings.resizable;
            this.toggleResizable();
            this.#zoomValue = guiSettings.zoom;
            this.#changeZoom();
        }
        
    }

    /**
     * Updates a setting inside "GUI Settings.json"
     * @param {String} name - Name of the json variable
     * @param {} value - Value to add to the variable
     */
    async save(name, value) {
   
        if (inside.electron) {
            // read the file
            const guiSettings = await getJson(`${stPath.text}/GUI Settings`);

            // update the setting's value
            guiSettings[name] = value;

            // save the file
            saveJson(`/GUI Settings`, guiSettings);
        }

    }

    setIntro(value) {
        this.#introCheck.checked = value;
    }
    isIntroChecked() {
        return this.#introCheck.checked;
    }

    setForceWL(value) {
        this.#forceWLCheck.checked = value;
    }
    isForceWLChecked() {
        return this.#forceWLCheck.checked;
    }

    toggleForceWL() {

        // forces the W/L buttons to appear, or unforces them
        if (this.isForceWLChecked()) {
            wl.show();
        } else {
            wl.hide();
        }

        // save current checkbox value to the settings file
        this.save("forceWL", this.isForceWLChecked());

    }

    isScoreAutoChecked() {
        return this.#scoreAutoCheck.checked;
    }

    isInvertScoreChecked() {
        return this.#invertScoreCheck.checked;
    }

    /**
     * Will copy the current match info to the clipboard
     * Format: "Tournament Name - Round - Player1 (Character1) VS Player2 (Character2)"
     */
    copyMatch() {

        // initialize the string
        let copiedText = tournament.getText() + " - " + round.getText() + " - ";

        if (gamemode.getGm() == 1) { // for singles matches
            // check if the player has a tag to add
            if (players[0].tag) {
                copiedText += players[0].tag + " | ";
            }
            copiedText += players[0].getName() + " (" + players[0].char +") VS ";
            if (players[1].tag) {
                copiedText += players[1].tag + " | ";
            }
            copiedText += players[1].getName() + " (" +  players[1].char +")";
        } else { // for team matches
            copiedText += teams[0].getName() + " VS " + teams[1].getName();
        }

        // send the string to the user's clipboard
        navigator.clipboard.writeText(copiedText);

    }

    #setAlwaysOnTopListener() {
        this.#alwaysOnTopCheck.addEventListener("click", () => {
            this.toggleAlwaysOnTop();
        });
    }
    async toggleAlwaysOnTop() {
        const ipc = await import("./IPC.mjs");
        ipc.alwaysOnTop(this.#alwaysOnTopCheck.checked);
        this.save("alwaysOnTop", this.#alwaysOnTopCheck.checked);
    }

    #setResizableListener() {
        this.#resizableCheck.addEventListener("click", () => {
            this.toggleResizable();
        });
    }
    async toggleResizable() {
        const ipc = await import("./IPC.mjs");
        ipc.resizable(this.#resizableCheck.checked);
        this.save("resizable", this.#resizableCheck.checked);
    }

    #lessZoom() {
        if (this.#zoomValue > 100) {
            this.#zoomValue -= 10;
            this.#changeZoom();
        }
    }
    #moreZoom() {
        if (this.#zoomValue < 400) {
            this.#zoomValue += 10;
            this.#changeZoom();
        }
    }
    #changeZoom() {
        const { webFrame } = require('electron');
        webFrame.setZoomFactor(this.#zoomValue / 100);
        this.#zoomTextValue.innerHTML = `${this.#zoomValue}%`;
        this.save("zoom", this.#zoomValue);
    }

    async #restoreWindowDefaults() {
        this.#resizableCheck.checked = false;
        this.toggleResizable();
        this.#zoomValue = 100;
        this.#changeZoom();
        const ipc = await import("./IPC.mjs");
        ipc.defaultWindowDimensions();
    }

}

export const settings = new GuiSettings;
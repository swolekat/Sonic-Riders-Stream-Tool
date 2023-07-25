import { bestOf } from "./BestOf.mjs";
import { casters } from "./Caster/Casters.mjs";
import { customChange, setCurrentPlayer } from "./Custom Skin.mjs";
import { displayNotif } from "./Notifications.mjs";
import { players } from "./Player/Players.mjs";
import { scores } from "./Score/Scores.mjs";
import { settings } from "./Settings.mjs";
import { teams } from "./Team/Teams.mjs";
import { tournament } from "./Tournament.mjs";
import { wl } from "./WinnersLosers.mjs";

/**
 * Updates the entire GUI with values sent remotely
 * @param {Object} data GUI info
 */
export async function updateGUI(data) {

    // set the gamemode and scoremode
    if (data.bestOf != bestOf.getBo) {
        bestOf.setBo(data.bestOf);
    }

    // set the settings
    settings.setIntro(data.allowIntro);
    if (data.forceWL != settings.isForceWLChecked()) {
        settings.setForceWL(data.forceWL);
        settings.toggleForceWL();
    }

    // player time
    for (let i = 0; i < players.length; i++) {

        // player info
        players[i].setName(data.player[i].name);
        players[i].setTag(data.player[i].tag);
        players[i].pronouns = data.player[i].pronouns;
        players[i].twitter = data.player[i].twitter;
        players[i].twitch = data.player[i].twitch;
        players[i].yt = data.player[i].yt;

        // player character and skin
        if (data.player[i].char != players[i].char || data.player[i].skin != players[i].skin.name) {
            await players[i].charChange(data.player[i].char, true);
            if (data.player[i].customImg) {
                setCurrentPlayer(players[i]);
                await customChange(data.player[i].skinHex, data.player[i].skin);
            } else {
                await players[i].skinChange(players[i].findSkin(data.player[i].skin));
            }
        }

    };

    // stuff for each side
    for (let i = 0; i < 2; i++) {
        scores[i].setScore(data.score[i]);
        teams[i].setName(data.teamName[i]);
    }

    // round info
    wl.setLeft(data.wl[0]);
    wl.setRight(data.wl[1]);
    tournament.setText(data.tournamentName);

    // and finally, casters
    for (let i = 0; i < casters.length; i++) {
        casters[i].setName(data.caster[i].name);
        casters[i].setTwitter(data.caster[i].twitter);
        casters[i].setTwitch(data.caster[i].twitch);
        casters[i].setYt(data.caster[i].yt);
    }

    // write it down
    displayNotif("GUI was remotely updated");
    
}
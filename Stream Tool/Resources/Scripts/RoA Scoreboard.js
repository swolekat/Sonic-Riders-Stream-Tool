'use strict';

//animation stuff
const fadeInTime = .3; //(seconds)
const fadeOutTime = .2;
let introDelay = .5; //all animations will get this delay when the html loads (use this so it times with your transition)

//max text sizes (used when resizing back)
const introSize = "85px";
const nameSize = "24px";
const tagSize = "17px";
const nameSizeDubs = "22px";
const tagSizeDubs = "15px";
const teamSize = "22px";
let numSize = "36px"
const roundSize = "19px";

//to avoid the code constantly running the same method over and over
const pCharPrev = [], scorePrev = [], wlPrev = [], topBarMoved = [];
let bestOfPrev;

//to consider how many loops will we do
let maxPlayers = 2;
const maxSides = 2;

// this will connect us to the GUI
let webSocket;

let startup = true;


//next, global variables for the html elements
const scoreboard = document.getElementsByClassName("scoreboard");
const teamNames = document.getElementsByClassName("teamName");
const topBars = document.getElementsByClassName("topBarTexts");
const wlText = document.getElementsByClassName("wlText");
const scoreImg = document.getElementsByClassName("scoreImgs");
const scoreNums = document.getElementsByClassName("scoreNum");
const scoreAnim = document.getElementsByClassName("scoreVid");
const tLogoImg = document.getElementsByClassName("tLogos");
const textRound = document.getElementById('round');
const borderImg = document.getElementsByClassName('border');

// we want the correct order, we cant use getClassName here
const pWrapper = [], pTag = [], pName = [], pProns = [], charImg = [];
function pushArrayInOrder(array, string) {
    for (let i = 0; i < 4; i++) {
        array.push(document.getElementById("p"+(i+1)+string));
    }
}
pushArrayInOrder(pWrapper, "Wrapper");
pushArrayInOrder(pTag, "Tag");
pushArrayInOrder(pName, "Name");
pushArrayInOrder(pProns, "Pronouns");
pushArrayInOrder(charImg, "Character");


// first we will start by connecting with the GUI with a websocket
startWebsocket();
function startWebsocket() {

	// change this to the IP of where the GUI is being used for remote control
	const webSocket = new WebSocket("ws://localhost:8080?id=gameData");
	webSocket.onopen = () => { // if it connects successfully
		// everything will update everytime we get data from the server (the GUI)
		webSocket.onmessage = function (event) {
			updateData(JSON.parse(event.data));
		}
		// hide error message in case it was up
		document.getElementById('connErrorDiv').style.display = 'none';
	}

	// if the connection closes, wait for it to reopen
	webSocket.onclose = () => {errorWebsocket()}

}
function errorWebsocket() {

	// show error message
	document.getElementById('connErrorDiv').style.display = 'flex';
	// delete current webSocket
	webSocket = null;
	// we will attempt to reconect every 5 seconds
	setTimeout(() => {
		startWebsocket();
	}, 5000);

}

async function updateData(scInfo) {

	const player = scInfo.player;
	const teamName = scInfo.teamName;

	const score = scInfo.score;
	const wl = scInfo.wl;

	const bestOf = scInfo.bestOf;

	const round = scInfo.round;


	// first of all, things that will always happen on each cycle
	
	// set the max players depending on singles or doubles
	maxPlayers = 2;

	// change border depending of the Best Of status
	if (bestOfPrev != bestOf) {
		updateBorder(bestOf); // update the border
		// update the score ticks so they fit the bestOf border
		updateScore(score[0], bestOf, 0, false);
		updateScore(score[1], bestOf, 1, false);
	}

	// now, things that will happen only once, when the html loads
	if (startup) {

		//of course, we have to start with the cool intro stuff
		if (scInfo.allowIntro) {

			//lets see that intro
			document.getElementById('overlayIntro').style.opacity = 1;

			//this vid is just the bars moving (todo: maybe do it through javascript?)
			const introVid = document.getElementById('introVid');
			introVid.src = 'Resources/Overlay/Scoreboard/Intro.webm';
			introVid.play();

			if (score[0] + score[1] == 0) { //if this is the first game, introduce players

				for (let i = 0; i < maxSides; i++) {
					const pIntroEL = document.getElementById('p'+(i+1)+'Intro');

					//update players intro text
					pIntroEL.textContent = player[i].name;

					pIntroEL.style.fontSize = introSize; //resize the font to its max size
					resizeText(pIntroEL); //resize the text if its too large
					
				}

				//player name fade in
				fadeInMove(document.getElementById("p1Intro"), introDelay, null, true);
				fadeInMove(document.getElementById("p2Intro"), introDelay, null, false);


			} else { //if its not the first game, show game count
				const midTextEL = document.getElementById('midTextIntro');
				if ((score[0] + score[1]) != 4) { //if its not the last game of a bo5

					//just show the game count in the intro
					midTextEL.textContent = "Game " + (score[0] + score[1] + 1);

				} else { //if game 5

					if ((round.toUpperCase() == "TRUE FINALS")) { //if true finals

						midTextEL.textContent = "True Final Game"; //i mean shit gets serious here
						
					} else {

						midTextEL.textContent = "Final Game";
						
						//if GF, we dont know if its the last game or not, right?
						if (round.toLocaleUpperCase() == "GRAND FINALS" && !(wl[0] == "L" && wl[1] == "L")) {
							fadeIn(document.getElementById("superCoolInterrogation"), introDelay+.5, 1.5);
						}

					}
				}
			}

			//round, tournament and VS/GameX text fade in
			document.querySelectorAll(".textIntro").forEach(el => {
				fadeIn(el, introDelay-.2, fadeInTime);
			});

			//aaaaand fade out everything
			fadeOut(document.getElementById("overlayIntro"), fadeInTime+.2, introDelay+1.8)

			//lets delay everything that comes after this so it shows after the intro
			introDelay = 2.5;
		}

		// this will be used later to sync the animations for all character images
		const charsLoaded = [];

		// now for the actual initialization of players
		for (let i = 0; i < maxPlayers; i++) {
			
			//lets start with the player names and tags
			updatePlayerName(i, player[i].name, player[i].tag);
			const side = (i % 2 == 0) ? true : false; //to know direction
			fadeInMove(pWrapper[i], introDelay, null, side); // fade it in with some movement

			// show player pronouns if any
			updatePronouns(i, player[i].pronouns);
			displayTopBarElement(pProns[i]);

			//set the character image for the player
			charsLoaded.push(updateChar(player[i].sc.charImg, player[i].sc.charPos, i));
			//the animation will be fired below, when the image finishes loading

			//save the character so we run the character change code only when this doesnt equal to the next
			pCharPrev[i] = player[i].sc.charImg;

		}

		// now we use that array from earlier to animate all characters at the same time
		Promise.all(charsLoaded).then( (value) => { // when all images are loaded
			for (let i = 0; i < value.length; i++) { // for every character loaded
				fadeInMove(value[i], introDelay+.2, true); // fade it in
			}
		})

		// this will run for each side (so twice)
		for (let i = 0; i < maxSides; i++) {

			// to know animation direction
			const side = (i % 2 == 0) ? true : false;

			// fade in move the scoreboards
			fadeInMove(scoreboard[i].parentElement, introDelay-.1, null, side);
			
			//if its grands, we need to show the [W] and/or the [L] on the players
			updateWL(wl[i], i);
			displayTopBarElement(wlText[i]);
			
			//save for later so the animation doesn't repeat over and over
			wlPrev[i] = wl[i];

			//set the current score
			updateScore(score[i], bestOf, i, false);
			scorePrev[i] = score[i];

			//check if we have a logo we can place on the overlay
			updateLogo(tLogoImg[i], player[i].tag);

			// fade in the top bar
			fadeInTopBar(topBars[i], introDelay+.6);
			
		}

		//update the round text	and fade it in
		updateText(textRound, round, roundSize);
		if (round) { // but only if theres any text to display
			fadeIn(textRound.parentElement, introDelay);
		}

		startup = false; //next time we run this function, it will skip all we just did
	}

	// now things that will happen on all the other cycles
	else {
		
		// this will be used later to sync the animations for all character images
		const charsLoaded = [], animsEnded = [];
		//lets check each player
		for (let i = 0; i < maxPlayers; i++) {
			
			//player names and tags
			if (pName[i].textContent != player[i].name || pTag[i].textContent != player[i].tag) {

				//check the player's side so we know the direction of the movement
				const side = (i % 2 == 0) ? true : false;

				//if this is singles, move the texts while updating
				//move and fade out the player 1's text
				fadeOutMove(pWrapper[i], null, side).then( () => {
					//now that nobody is seeing it, quick, change the text's content!
					updatePlayerName(i, player[i].name, player[i].tag);
					//fade the name back in with a sick movement
					fadeInMove(pWrapper[i], 0, null, side);
				});
				
			}

			// show player pronouns if any
			if (player[i].pronouns != pProns[i].textContent) {
				topBarMoved[i % 2] = true;
				fadeOutTopBar(topBars[i % 2]).then( () => {
					updatePronouns(i, player[i].pronouns);
					displayTopBarElement(pProns[i]);
				});
			}

			//player characters and skins
			if (pCharPrev[i] != player[i].sc.charImg) {

				//fade out the image while also moving it because that always looks cool
				animsEnded.push(fadeOutMove(charImg[i], true, null).then( () => {
					//now that nobody can see it, lets change the image!
					charsLoaded.push(updateChar(player[i].sc.charImg, player[i].sc.charPos, i));
					//will fade in when image finishes loading
				}));
				pCharPrev[i] = player[i].sc.charImg;
			}

		}
		// now we use that array from earlier to animate all characters at the same time
		Promise.all(animsEnded).then( () => { // need to sync somehow
			Promise.all(charsLoaded).then( (value) => { // when all images are loaded
				for (let i = 0; i < value.length; i++) { // for every character loaded
					fadeInMove(value[i], .1, true); // fade it in
				}
			})
		})

		//now let's check stuff from each side
		for (let i = 0; i < maxSides; i++) {

			//the [W] and [L] status for grand finals
			if (wlPrev[i] != wl[i]) {
				//move it away!
				fadeOutTopBar(topBars[i]).then( () => {
					//change the thing!
					updateWL(wl[i], i);
					displayTopBarElement(wlText[i]);
				});
				wlPrev[i] = wl[i];
				topBarMoved[i] = true;
			}

			// if either W/L status or pronouns changed
			if (topBarMoved[i]) {
				setTimeout(() => {
					// move it back up!
					fadeInTopBar(topBars[i]);
					topBarMoved[i] = false;
				}, 500);
			}

			//score check
			if (scorePrev[i] != score[i]) {
				updateScore(score[i], bestOf, i, true);
				scorePrev[i] = score[i];
			}

			//check if we have a logo we can place on the overlay
			if (pTag[i].textContent != player[i].tag) {
				fadeOut(tLogoImg[i]).then( () => {
					updateLogo(tLogoImg[i], player[i].tag);
					fadeIn(tLogoImg[i]);
				});
			}
		}
		
		//and finally, update the round text
		if (textRound.textContent != round){
			fadeOut(textRound).then( () => {
				updateText(textRound, round, roundSize);
				fadeIn(textRound);
			});
			// if theres no text, hide everything
			if (round && textRound.parentElement.style.opacity == 0) {
				fadeIn(textRound.parentElement, fadeOutTime);
			} else if (!round) {
				fadeOut(textRound.parentElement);
			}
		}

	}
}

// update functions
async function updateScore(pScore, bestOf, pNum) {
	// change the score image with the new values
	scoreImg[pNum].src = `Resources/Overlay/Scoreboard/Score/1/Bo${bestOf} ${pScore}.png`;
	// update that score number in case we are using those
	updateText(scoreNums[pNum], pScore, numSize);

}

function updateBorder(bestOf) {
	for (let i = 0; i < borderImg.length; i++) {
		borderImg[i].src = `Resources/Overlay/Scoreboard/Borders/Border 1 Bo${bestOf}.png`;
		if (bestOf == "X") {
			scoreNums[i].style.display = "flex";
			
		} else {
			scoreNums[i].style.display = "none";
		}
		if (bestOf == "X") {
			borderImg[i].style.transform = "translateX(-26px)";
			topBars[i].parentElement.parentElement.style.transform = "translateX(-26px)";
		} else {
			borderImg[i].style.transform = "translateX(0px)";
			topBars[i].parentElement.parentElement.style.transform = "translateX(0px)";
		}
	}
	bestOfPrev = bestOf
}

function updateLogo(logoEL, nameLogo) {
	logoEL.src = `Resources/Logos/${nameLogo}.png`;
}

function updatePlayerName(pNum, name, tag) {
	pName[pNum].style.fontSize = nameSize;
	pTag[pNum].style.fontSize = tagSize;
	pName[pNum].textContent = name; //change the actual text
	pTag[pNum].textContent = tag;
	resizeText(pWrapper[pNum]); //resize if it overflows
}

//generic text changer
function updateText(textEL, textToType, maxSize) {
	textEL.style.fontSize = maxSize; //set original text size
	textEL.textContent = textToType; //change the actual text
	resizeText(textEL); //resize it if it overflows
}

function updateWL(pWL, pNum) {
	//check if winning or losing in a GF, then change image
	if (pWL == "W") {
		wlText[pNum].textContent = "WINNERS";
		wlText[pNum].style.color = "#76a276";
	} else if (pWL == "L") {
		wlText[pNum].textContent = "LOSERS";
		wlText[pNum].style.color = "#a27677";
	} else if (wlText[pNum].textContent == "WINNERS" || wlText[pNum].textContent == "LOSERS") {
		// clear contents if there are no pronouns
		wlText[pNum].textContent = "";
	}
}

function updatePronouns(pNum, pronouns) {
	pProns[pNum].textContent = pronouns;
}

function displayTopBarElement(el) {
	if (el.textContent) {
		el.style.display = "block";
	} else {
		el.style.display = "none";
	}
}


//fade out
async function fadeOut(itemID, dur = fadeOutTime, delay = 0) {
	// actual animation
	itemID.style.animation = `fadeOut ${dur}s ${delay}s both`;
	// this function will return a promise when the animation ends
	await new Promise(resolve => setTimeout(resolve, dur * 1000)); // translate to miliseconds
}

//fade out but with movement
async function fadeOutMove(itemID, chara, side) {

	if (chara) {
		// we need to target a different element since chromium
		// does not support idependent transforms on css yet
		itemID.parentElement.style.animation = `charaMoveOut ${fadeOutTime}s both
			,fadeOut ${fadeOutTime}s both`
		;
	} else {
		if (side) {
			itemID.style.animation = `moveOutLeft ${fadeOutTime}s both
				,fadeOut ${fadeOutTime}s both`
			;
		} else {
			itemID.style.animation = `moveOutRight ${fadeOutTime}s both
				,fadeOut ${fadeOutTime}s both`
			;
		}
		
	}
	
	await new Promise(resolve => setTimeout(resolve, fadeOutTime * 1000));

}

//fade in
function fadeIn(itemID, delay = 0, dur = fadeInTime) {
	itemID.style.animation = `fadeIn ${dur}s ${delay}s both`;
}

//fade in but with movement
function fadeInMove(itemID, delay = 0, chara, side) {
	if (chara) {
		itemID.parentElement.style.animation = `charaMoveIn ${fadeOutTime}s ${delay}s both
			, fadeIn ${fadeOutTime}s ${delay}s both`
		;
	} else {
		if (side) {
			itemID.style.animation = `moveInLeft ${fadeInTime}s ${delay}s both
				, fadeIn ${fadeInTime}s ${delay}s both`
			;
		} else {
			itemID.style.animation = `moveInRight ${fadeInTime}s ${delay}s both
				, fadeIn ${fadeInTime}s ${delay}s both`
			;
		}
	}
}

//movement for the [W]/[L] images
async function fadeOutTopBar(el) {
	el.style.animation = `wlMoveOut .4s both`;
	await new Promise(resolve => setTimeout(resolve, 400));
}
function fadeInTopBar(el, delay = 0) {
	el.style.animation = `wlMoveIn .4s ${delay}s both`;
}


//text resize, keeps making the text smaller until it fits
function resizeText(textEL) {
	const childrens = textEL.children;
	while (textEL.scrollWidth > textEL.offsetWidth) {
		if (childrens.length > 0) { //for tag+player texts
			Array.from(childrens).forEach((child) => {
				child.style.fontSize = getFontSize(child);
			});
		} else {
			textEL.style.fontSize = getFontSize(textEL);
		}
	}
}

//returns a smaller fontSize for the given element
function getFontSize(textElement) {
	return (parseFloat(textElement.style.fontSize.slice(0, -2)) * .90) + 'px';
}

// time to change that image!
async function updateChar(charSrc, charPos, pNum) {

	// change the image path
	charImg[pNum].src = charSrc;

	// position the character
	charImg[pNum].style.transform = `translate(${charPos[0]}px, ${charPos[1]}px) scale(${charPos[2]})`;

	// this will make the thing wait till the image is fully loaded
	await charImg[pNum].decode();

	return charImg[pNum];

}

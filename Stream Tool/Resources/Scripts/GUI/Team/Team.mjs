export class Team {

    #tNameInp;
    #num;

    constructor(el, num) {

        this.#tNameInp = el.getElementsByClassName("teamName")[0];
        this.#num = num;

    }

    getName() {
        return this.#tNameInp.value;
    }
    setName(text) {
        this.#tNameInp.value = "";
    }
    getNameInp() {
        return this.#tNameInp;
    }

}
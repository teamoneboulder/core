modules.galactic_signature_global={//not done
	get:function(){
		if (gaps = ["1", "20", "22", "39", "43", "50", "51", "58", "64", "69", "72", "77", "85", "88", "93", "96", "106", "107", "108", "109", "110", "111", "112", "113", "114", "115", "146", "147", "148", "149", "150", "151", "152", "153", "154", "155", "165", "168", "173", "176", "184", "189", "192", "197", "203", "210", "211", "218", "222", "239", "241", "260"], season = ["10", "30", "50", "55", "75", "95", "115", "120", "140", "160", "180", "185", "205", "225", "245", "250"], sseal = ["Sun", "Dragon", "Wind", "Night", "Seed", "Serpent", "World-Bridger", "Hand", "Star", "Moon", "Dog", "Monkey", "Human", "Skywalker", "Wizard", "Eagle", "Warrior", "Earth", "Mirror", "Storm"], color = ["yellow", "red", "white", "blue", "yellow", "red", "white", "blue", "yellow", "red", "white", "blue", "yellow", "red", "white", "blue", "yellow", "red", "white", "blue"], ttone = ["Sunyata", "magnetic", "lunar", "electric", "self-existing", "overtone", "rhythmic", "resonant", "galactic", "solar", "planetary", "spectral", "crystal", "cosmic"], months = ["0", "31", "28", "31", "30", "31", "30", "31", "31", "30", "31", "30", "31"], mname = ["0", "January", "Febuary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], wdays = ["0", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], poemseal = ["enlighten", "nurture", "communicate", "dream", "target", "survive", "equalize", "know", "beautify", "purify", "love", "play", "influence", "explore", "enchant", "create", "question", "evolve", "reflect", "catalyse"], poemseal2 = ["life", "being", "breath", "intuition", "awareness", "instinct", "opportunity", "healing", "art", "flow", "loyalty", "illusion", "wisdom", "wakefulness", "receptivity", "mind", "fearlessness", "synchronicity", "order", "energy"], poemseal3 = ["matrix", "input", "input", "input", "input", "store", "store", "store", "store", "process", "process", "process", "process", "output", "output", "output", "output", "matrix", "matrix", "matrix"], poemseal4 = ["universal fire", "birth", "spirit", "abundance", "flowering", "life force", "death", "accomplishment", "elegance", "universal water", "heart", "magic", "free will", "space", "timelessness", "vision", "intelligence", "navigation", "endlessness", "self-generation"], guidedby = ["universal fire", "birth", "spirit", "abundance", "flowering", "life force", "death", "accomplishment", "elegance", "universal water", "heart", "magic", "free will", "space", "timelessness", "vision", "intelligence", "navigation", "endlessness", "self-generation"], toneseal = ["0", "unify", "polarize", "activate", "define", "empower", "organize", "channel", "harmonize", "pulse", "perfect", "dissolve", "dedicate", "endure"], toneseal2 = ["0", "Attracting", "Stabilizing", "Bonding", "Measuring", "Commanding", "Balancing", "Inspiring", "Modeling", "Realizing", "Producing", "Releasing", "Universalizing", "Transcending"], toneseal3 = ["0", "purpose", "challenge", "service", "form", "radiance", "equality", "attunement", "integrity", "intention", "manifestation", "liberation", "cooperation", "presence"], year = 10, seal = 9, number = 49, g > 2002)
		    for (i = g - 2002, z = 1; z <= i; z++) seal += 5, year += 1, year >= 14 && (year = 1), number += 105, number >= 261 && (number -= 260), seal >= 20 && (seal = 4);
		if (2002 > g)
		    for (i = 2002 - g, z = 1; z <= i; z++) seal -= 5, number -= 105, number <= 2 && (number += 260), year -= 1, year <= 0 && (year = 13), seal <= 3 && (seal = 19);
		for (7 > p && (seal -= 5, year -= 1, number -= 105, number <= 2 && (number += 260), year <= 0 && (year = 13), seal <= 3 && (seal = 19)), 7 == p && 26 > m && (seal -= 5, year -= 1, number -= 105, number <= 2 && (number += 260), year <= 0 && (year = 13), seal <= 3 && (seal = 19)), yeartone = year, yearseal = seal, tone = year, xx = 7, xy = 26, kin = number, moon = 1, mday = 1, wday = 1; xx != p || xy != m;) kin++, xy++, seal++, tone++, mday++, wday++, wday > 7 && (wday = 1), mday > 28 && (mday = 1, moon++), 20 == seal && (seal = 0), 261 == kin && (kin = 1), 14 == tone && (tone = 1), xy > months[xx] && (xx++, xy = 1, 13 == xx && (xx = 1));
		for (e.innerHTML = "", l(e, "h3", "Your birthday on the 13 Moon Calendar"), 14 == moon ? l(e, "h4", "The Day Out of Time!") : l(e, "h4", ttone[moon] + " Moon " + mday), l(e, "h4", "Year of the " + color[yearseal] + " " + ttone[yeartone] + " " + sseal[yearseal]), l(e, "h3", "Your Galactic Signature"), l(e, "img", y + kin + ".gif"), l(e, "h4", "Kin " + kin + ": " + color[seal] + " " + ttone[tone] + " " + sseal[seal]), l(e, "span", "I " + toneseal[tone] + " in order to " + poemseal[seal]), l(e, "br", ""), l(e, "span", toneseal2[tone] + " " + poemseal2[seal]), l(e, "br", ""), l(e, "span", "I seal the " + poemseal3[seal] + " of " + poemseal4[seal]), l(e, "br", ""), l(e, "span", "With the " + ttone[tone] + " tone of " + toneseal3[tone]), l(e, "br", ""), 1 == tone || 6 == tone || 11 == tone ? (l(e, "span", "I am guided by my own power doubled"), l(e, "br", "")) : 3 == tone || 8 == tone || 13 == tone ? (guide = seal + 4, guide >= 20 && (guide -= 20), l(e, "span", "I am guided by the power of " + guidedby[guide]), l(e, "br", "")) : 2 == tone || 7 == tone || 12 == tone ? (guide = seal + 12, guide >= 20 && (guide -= 20), l(e, "span", "I am guided by the power of " + guidedby[guide]), l(e, "br", "")) : 5 == tone || 10 == tone ? (guide = seal + 8, guide >= 20 && (guide -= 20), l(e, "span", "I am guided by the power of " + guidedby[guide]), l(e, "br", "")) : (4 == tone || 9 == tone) && (guide = seal - 4, guide < 0 && (guide += 20), l(e, "span", "I am guided by the power of " + guidedby[guide]), l(e, "br", "")), i = 0; i < gaps.length; i++) kin == gaps[i] && (l(e, "span", "I am a galactic activation portal &nbsp; &nbsp;enter me."), l(e, "br", ""));
		for (i = 0; i < season.length; i++) kin == season[i] && (3 == tone && l(e, "span", "I am a polar kin &nbsp; &nbsp;I establish the " + color[seal] + " galactic spectrum"), 11 == tone && l(e, "span", "I am a polar kin &nbsp; &nbsp;I transport the " + color[seal] + " galactic spectrum."), 4 == tone && l(e, "span", "I am a polar kin &nbsp; &nbsp;I convert the " + color[seal] + " galactic spectrum."), 10 == tone && l(e, "span", "I am a polar kin &nbsp; &nbsp;I extend the " + color[seal] + " galactic spectrum."));
		return !0
	}
};
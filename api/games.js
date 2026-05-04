const https = require('https');

const GAMES = [{"name": "Harmonies", "type": "Tile placement / Pattern building", "description": "Build habitats with colored tokens to attract animals and score for landscapes.", "bgg_id": 414317, "bgg": "https://boardgamegeek.com/boardgame/414317/harmonies"}, {"name": "Finspan", "type": "Engine building / Tableau building", "description": "Attract fish to ocean zones, build schools, and create scoring combos.", "bgg_id": 421638, "bgg": "https://boardgamegeek.com/boardgame/421638/finspan"}, {"name": "Tiletum", "type": "Euro / Dice drafting", "description": "Travel Renaissance Europe, complete contracts, and build structures for prestige.", "bgg_id": 330592, "bgg": "https://boardgamegeek.com/boardgame/330592/tiletum"}, {"name": "The Vale of Eternity", "type": "Card drafting / Tableau building", "description": "Draft and tame mythical creatures to build a high-scoring fantasy tableau.", "bgg_id": 367495, "bgg": "https://boardgamegeek.com/boardgame/367495"}, {"name": "The Witcher: Old World", "type": "Adventure / Competitive", "description": "Train as witchers, explore the continent, hunt monsters, and gain glory.", "bgg_id": 331106, "bgg": "https://boardgamegeek.com/boardgame/331106"}, {"name": "Canvas", "type": "Card layering / Abstract", "description": "Layer transparent cards to create paintings and fulfill scoring goals.", "bgg_id": 314877, "bgg": "https://boardgamegeek.com/boardgame/314877"}, {"name": "Daybreak", "type": "Cooperative / Engine building", "description": "Work together as world powers to slow climate change and build resilient systems.", "bgg_id": 362692, "bgg": "https://boardgamegeek.com/boardgame/362692"}, {"name": "The Quacks of Quedlinburg", "type": "Push your luck / Bag building", "description": "Pull ingredients from your bag to brew potions without exploding.", "bgg_id": 244521, "bgg": "https://boardgamegeek.com/boardgame/244521"}, {"name": "Leaf", "type": "Tile placement / Nature", "description": "Guide falling leaves across the forest floor to create scoring patterns.", "bgg_id": 375872, "bgg": "https://boardgamegeek.com/boardgame/375872"}, {"name": "Spectacular", "type": "Tile drafting / Family strategy", "description": "Draft and place tiles to create a high-scoring visual display.", "bgg_id": 392885, "bgg": "https://boardgamegeek.com/boardgame/392885"}, {"name": "Wonderland's War", "type": "Area control / Bag building", "description": "Lead a Wonderland faction in whimsical battles using bag-building tactics.", "bgg_id": 318057, "bgg": "https://boardgamegeek.com/boardgame/318057"}, {"name": "In the Footsteps of Marie Curie", "type": "Historical / Educational", "description": "Conduct experiments and follow Marie Curie's scientific career.", "bgg_id": 378457, "bgg": "https://boardgamegeek.com/boardgame/378457"}, {"name": "Sagrada", "type": "Dice drafting / Puzzle", "description": "Draft colorful dice to complete a stained-glass window under placement restrictions.", "bgg_id": 199561, "bgg": "https://boardgamegeek.com/boardgame/199561"}, {"name": "Terminus", "type": "Sci-fi strategy", "description": "Compete for resources and influence in a futuristic terminal setting.", "bgg_id": 380080, "bgg": "https://boardgamegeek.com/boardgame/380080"}, {"name": "Ragnarocks", "type": "Abstract / Two-player strategy", "description": "Place stones and ships to control territory in a Norse-themed duel.", "bgg_id": 296218, "bgg": "https://boardgamegeek.com/boardgame/296218"}, {"name": "The Legends of Andor: The Eternal Frost", "type": "Cooperative / Adventure", "description": "Work together in a frozen chapter of Andor to overcome threats.", "bgg_id": 332952, "bgg": "https://boardgamegeek.com/boardgame/332952"}, {"name": "Shallow Sea", "type": "Tile laying / Nature", "description": "Build an underwater ecosystem and score for connected marine habitats.", "bgg_id": 389185, "bgg": "https://boardgamegeek.com/boardgame/389185"}, {"name": "Arcs", "type": "Sci-fi conflict / Card driven", "description": "Use card-driven decisions and asymmetric powers in a space conflict game.", "bgg_id": 359871, "bgg": "https://boardgamegeek.com/boardgame/359871"}, {"name": "Tesseract", "type": "Cooperative / Puzzle", "description": "Coordinate with the team to disarm a dangerous multidimensional cube.", "bgg_id": 274786, "bgg": "https://boardgamegeek.com/boardgame/274786"}, {"name": "Innovation Ultimate", "type": "Civilization / Card strategy", "description": "Advance technologies across eras and leverage powerful card effects.", "bgg_id": 341427, "bgg": "https://boardgamegeek.com/boardgame/341427"}, {"name": "MESOS", "type": "Set collection / Strategy", "description": "Build influence in an ancient setting through careful development and scoring.", "bgg_id": 396825, "bgg": "https://boardgamegeek.com/boardgame/396825"}, {"name": "River Valley Glassworks", "type": "Worker placement / Resource management", "description": "Gather materials and craft glassworks for points and efficiency.", "bgg_id": 398143, "bgg": "https://boardgamegeek.com/boardgame/398143"}, {"name": "Nature", "type": "Tile placement / Ecosystem", "description": "Create a thriving ecosystem by placing terrain and wildlife strategically.", "bgg_id": 383793, "bgg": "https://boardgamegeek.com/boardgame/383793"}, {"name": "Atlantis Rising (Second Edition)", "type": "Cooperative / Worker placement", "description": "Gather resources and build an escape gate before Atlantis sinks.", "bgg_id": 290408, "bgg": "https://boardgamegeek.com/boardgame/290408"}, {"name": "Space Base", "type": "Engine building / Dice", "description": "Build a fleet that activates on your rolls and opponents' rolls.", "bgg_id": 242302, "bgg": "https://boardgamegeek.com/boardgame/242302"}, {"name": "Namiji", "type": "Set collection / Route building", "description": "Sail the Japanese coast, fish, and collect scenic treasures.", "bgg_id": 334575, "bgg": "https://boardgamegeek.com/boardgame/334575"}, {"name": "Star Wars: The Clone Wars", "type": "Cooperative / Thematic", "description": "Lead Jedi and clone forces across missions during the Clone Wars.", "bgg_id": 356568, "bgg": "https://boardgamegeek.com/boardgame/356568"}, {"name": "Robot Quest Arena", "type": "Deck building / Battle", "description": "Upgrade your robot deck and battle opponents in an arena.", "bgg_id": 348325, "bgg": "https://boardgamegeek.com/boardgame/348325"}, {"name": "Trekking the World", "type": "Family strategy / Route building", "description": "Travel globally, visit landmarks, and collect souvenirs for points.", "bgg_id": 311729, "bgg": "https://boardgamegeek.com/boardgame/311729"}, {"name": "World Wonders", "type": "City building / Tile placement", "description": "Build a civilization with monuments, roads, and careful spatial planning.", "bgg_id": 379078, "bgg": "https://boardgamegeek.com/boardgame/379078"}, {"name": "Age of Wonders: Planetfall", "type": "4X / Strategy", "description": "Lead a faction on alien worlds through exploration, expansion, and conflict.", "bgg_id": 252501, "bgg": "https://boardgamegeek.com/boardgame/252501"}, {"name": "Please Don't Burn My Village!", "type": "Family / Cooperative", "description": "Work together to protect a village and manage a looming dragon threat.", "bgg_id": 369880, "bgg": "https://boardgamegeek.com/boardgame/369880"}, {"name": "Parks (Second Edition)", "type": "Worker placement / Nature", "description": "Hike trails, collect memories, and visit national parks across seasons.", "bgg_id": 266524, "bgg": "https://boardgamegeek.com/boardgame/266524"}, {"name": "Star Wars: Battle of Hoth", "type": "War game / Asymmetric", "description": "Command Rebels or Imperials in a ground battle on Hoth.", "bgg_id": 8978, "bgg": "https://boardgamegeek.com/boardgame/8978"}, {"name": "Planet Unknown", "type": "Polyomino / Simultaneous play", "description": "Develop a planet by placing polyomino tiles and advancing tracks.", "bgg_id": 258779, "bgg": "https://boardgamegeek.com/boardgame/258779"}, {"name": "Perch", "type": "Abstract / Area majority", "description": "Place birds strategically on a shared tree to score positions and control.", "bgg_id": 395404, "bgg": "https://boardgamegeek.com/boardgame/395404"}, {"name": "The Grizzled", "type": "Cooperative / Hand management", "description": "Survive the hardships of World War I through teamwork and timing.", "bgg_id": 171668, "bgg": "https://boardgamegeek.com/boardgame/171668"}, {"name": "Ancient Knowledge", "type": "Card strategy / Engine building", "description": "Build monuments and pass knowledge across generations for points.", "bgg_id": 322288, "bgg": "https://boardgamegeek.com/boardgame/322288"}, {"name": "Fall of the Mountain King", "type": "Area control / Fantasy strategy", "description": "Lead troll clans and defend the mountain realm through conflict and planning.", "bgg_id": 341358, "bgg": "https://boardgamegeek.com/boardgame/341358"}, {"name": "Dice Throne: Season One", "type": "Dice combat / Dueling", "description": "Choose a hero and battle using custom dice and asymmetric powers.", "bgg_id": 241451, "bgg": "https://boardgamegeek.com/boardgame/241451"}, {"name": "Mycelia", "type": "Deck building / Nature", "description": "Forage through a forest, build combos, and collect valuable mushrooms.", "bgg_id": 362369, "bgg": "https://boardgamegeek.com/boardgame/362369"}, {"name": "The Quacks of Quedlinburg: MegaBox", "type": "Push your luck / Bag building", "description": "Big-box edition of Quacks bundling the core game with expansions.", "bgg_id": 244521, "bgg": "https://boardgamegeek.com/boardgame/244521"}, {"name": "SCOUT", "type": "Card shedding / Ladder climbing", "description": "Play runs or sets from a fixed hand order while scouting better cards.", "bgg_id": 291453, "bgg": "https://boardgamegeek.com/boardgame/291453"}, {"name": "Last Light", "type": "4X / Sci-fi", "description": "Play a fast civilization-style space game in a collapsing galaxy.", "bgg_id": 360297, "bgg": "https://boardgamegeek.com/boardgame/360297"}, {"name": "Black Forest", "type": "Tile placement / Strategy", "description": "Build a valuable forest estate by placing tiles and optimizing features.", "bgg_id": 355093, "bgg": "https://boardgamegeek.com/boardgame/355093"}, {"name": "Everdell Farshore", "type": "Worker placement / Tableau building", "description": "Build a seaside city with critters, constructions, and nautical exploration.", "bgg_id": 376683, "bgg": "https://boardgamegeek.com/boardgame/376683"}, {"name": "March of the Ants: Evolved Edition", "type": "Worker placement / Area control", "description": "Expand an ant colony, adapt traits, and compete for survival.", "bgg_id": 146951, "bgg": "https://boardgamegeek.com/boardgame/146951"}];

function fetchUrl(urlStr) {
  return new Promise((resolve, reject) => {
    https.get(urlStr, { headers: { 'User-Agent': 'BGGCatalog/1.0' } }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseField(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`));
  return m ? m[1].trim() : '';
}

function parseAttr(xml, tag, attr) {
  const m = xml.match(new RegExp(`<${tag}[^>]*\\s${attr}="([^"]+)"`));
  return m ? m[1].trim() : '';
}

async function fetchBGGChunk(ids) {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${ids.join(',')}&stats=1&type=boardgame`;
  const xml = await fetchUrl(url);
  const result = {};
  const items = xml.match(/<item\s[^>]*type="boardgame"[\s\S]*?<\/item>/g) || [];
  for (const item of items) {
    const id = parseInt((item.match(/\sid="(\d+)"/) || [])[1]);
    if (!id) continue;
    let thumbnail = parseField(item, 'thumbnail');
    if (thumbnail && !thumbnail.startsWith('http')) thumbnail = 'https:' + thumbnail;
    const rating = parseFloat(parseAttr(item, 'average', 'value') || '0').toFixed(1);
    const minPlayers = parseAttr(item, 'minplayers', 'value') || '?';
    const maxPlayers = parseAttr(item, 'maxplayers', 'value') || '?';
    result[id] = { thumbnail, rating, minPlayers, maxPlayers };
  }
  return result;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');
  try {
    const uniqueIds = [...new Set(GAMES.map(g => g.bgg_id))];
    const chunks = [];
    for (let i = 0; i < uniqueIds.length; i += 20) chunks.push(uniqueIds.slice(i, i + 20));
    const bggMap = {};
    for (const chunk of chunks) {
      const data = await fetchBGGChunk(chunk);
      Object.assign(bggMap, data);
    }
    const enriched = GAMES.map(g => ({
      ...g,
      thumbnail: bggMap[g.bgg_id]?.thumbnail || '',
      rating:    bggMap[g.bgg_id]?.rating    || 'N/A',
      minPlayers:bggMap[g.bgg_id]?.minPlayers|| '?',
      maxPlayers:bggMap[g.bgg_id]?.maxPlayers|| '?',
    }));
    res.status(200).json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

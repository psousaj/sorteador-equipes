/**
 * Brazilian name gender inference.
 * Uses a compact dataset of common Brazilian names.
 * Falls back to heuristics for names not in the dataset.
 */

// Brazilian names dataset (most common ones)
const MALE_NAMES = new Set([
  'joão', 'joao', 'pedro', 'lucas', 'matheus', 'mateus', 'gabriel', 'rafael', 'marcos', 'marcus',
  'felipe', 'gustavo', 'arthur', 'samuel', 'daniel', 'davi', 'bruno', 'tiago', 'thiago', 'leandro',
  'andré', 'andre', 'anderson', 'eduardo', 'rodrigo', 'ricardo', 'carlos', 'paulo', 'jose', 'josé',
  'fernando', 'alexandre', 'leonardo', 'diego', 'vinicius', 'vinícius', 'caio', 'luan', 'guilherme',
  'henrique', 'igor', 'lucas', 'luiz', 'luís', 'fábio', 'fabio', 'marcelo', 'alex', 'alan',
  'roberto', 'wesley', 'willian', 'william', 'edson', 'adriano', 'rogerio', 'rogério', 'valdir',
  'mauricio', 'maurício', 'renato', 'sergio', 'sérgio', 'mauro', 'nelson', 'francisco', 'antônio',
  'antonio', 'jorge', 'miguel', 'enzo', 'gabriel', 'rael', 'joaquim', 'bento', 'noah', 'liam',
  'heitor', 'bernardo', 'theo', 'théo', 'murilo', 'cauã', 'caua', 'pietro', 'nicolas', 'nathan',
  'bryan', 'ryan', 'ian', 'ravi', 'otto', 'arthur', 'david', 'vitor', 'victor', 'lorenzo',
  'breno', 'kaique', 'rhyan', 'emanuel', 'henrique', 'yuri', 'augusto', 'lucas', 'enzo',
  'benicio', 'benício', 'oliver', 'elvis', 'edgar', 'wagner', 'flavio', 'flávio', 'cristiano',
  'alberto', 'severino', 'genésio', 'genesio', 'josias', 'osvaldo', 'jairo', 'nilson', 'adilson',
  'jeferson', 'wellingto', 'wellington', 'sidnei', 'claudinei', 'manoel', 'julio', 'julio',
  'everton', 'eder', 'éder', 'milton', 'djalma', 'givaldo', 'ronaldo', 'reginaldo', 'jefferson',
  'danilo', 'washington', 'cleiton', 'junior', 'júnior', 'luan', 'maicon', 'michel',
  'glauco', 'udo', 'mikael', 'alessandro', 'cleberson', 'wanderson', 'jucelino', 'amadeu',
  'hermes', 'zezinho', 'chico', 'tadeu', 'cristian', 'michael', 'kleber', 'ramon',
  'david', 'isaac', 'abner', 'ademir', 'adilson', 'ailton', 'alexsandro', 'aloisio',
  'amilton', 'anilton', 'ari', 'ariel', 'armando', 'aurelio', 'benedito', 'celso',
  'cesar', 'cid', 'claudio', 'cleber', 'dario', 'deivid', 'deivison', 'delson',
  'denis', 'deonisio', 'dercio', 'deyverson', 'diogo', 'dionisio', 'djalma',
  'donizete', 'dorian', 'durval', 'edcarlos', 'edenilson', 'edimilson', 'edinaldo',
  'edivânia', 'edmundo', 'ednaldo', 'edvaldo', 'elias', 'eliel', 'eliseu', 'emerson',
  'ercilio', 'erico', 'ernane', 'ernesto', 'eudes', 'eurico', 'ezequiel', 'fabiano',
  'fabricio', 'francisco', 'frederico', 'gendro', 'genival', 'geraldino', 'geraldo',
  'gerson', 'gilberto', 'gildo', 'gilmar', 'gilmario', 'gilson', 'givanildo',
  'glaucimar', 'gonçalo', 'goncalo', 'helder', 'heli', 'heliodoro', 'heraldo',
  'hercules', 'herivelto', 'hideraldo', 'horacio', 'hudson', 'hugo', 'humberto',
  'idalécio', 'idalecio', 'ijo', 'ilson', 'inezio', 'irineu', 'irino',
  'ismael', 'israel', 'italo', 'izaias', 'jacó', 'jaco', 'jailson', 'jairo',
  'jandir', 'janilson', 'januario', 'jean', 'jefte', 'jeovan', 'jessé', 'jesse',
  'jonas', 'jorge', 'josé', 'jose', 'joshua', 'josue', 'jucelino', 'juliano',
  'jurandir', 'juvêncio', 'juvencio', 'kenedy', 'lazaro', 'ledo', 'leomar',
  'leopoldo', 'levi', 'lindomar', 'lino', 'lisandro', 'lojias', 'luciano',
  'lucio', 'ludgero', 'lurival', 'macario', 'magno', 'manoel', 'mansueto',
  'marden', 'mario', 'marlon', 'mauro', 'maximiliano', 'micael', 'moises',
  'nabor', 'nael', 'napoleao', 'narciso', 'nathan', 'nazareno', 'neilson',
  'neilton', 'neison', 'nelson', 'neri', 'neuro', 'ney', 'nilmar', 'nilson',
  'nilto', 'nilton', 'noel', 'norberto', 'odair', 'odalberto', 'odilon',
  'olavo', 'oliveira', 'orlando', 'orlei', 'oslei', 'osmar', 'osvaldo',
  'otacilio', 'otaviano', 'otavio', 'ouvidio', 'oziel', 'patrik', 'paulo',
  'pedro', 'percival', 'peterson', 'ricardo', 'rivaldo', 'roberto',
  'robson', 'robsson', 'roderico', 'rodolfo', 'rodrigo', 'roger', 'rolando',
  'romario', 'rômulo', 'romulo', 'ronaldo', 'ronan', 'roque', 'rubens',
  'ruy', 'saulo', 'sergio', 'silas', 'silvio', 'simeao', 'simone', 'sofia',
  'solano', 'tereza', 'teobaldo', 'teodoro', 'teotonio', 'tercio', 'tey',
  'thales', 'theo', 'tiburtino', 'ticiano', 'timoteo', 'tobias', 'tomaz',
  'tomas', 'uberlando', 'udo', 'ulisses', 'umberto', 'uanderson', 'vagner',
  'valdecir', 'valdemar', 'valdir', 'valdomiro', 'valentin', 'valter',
  'vanderlei', 'vanderly', 'vanderson', 'vantuir', 'veneslau', 'verissimo',
  'vicente', 'vidal', 'vilmar', 'viriato', 'vitor', 'vitório', 'vladimir',
  'wagner', 'waldemar', 'waldisney', 'walfrido', 'walter', 'wander',
  'wanderlei', 'wando', 'washington', 'wellington', 'wemerson', 'wender',
  'wesley', 'wilamar', 'wilber', 'wildes', 'wilhan', 'wilker', 'willame',
  'willans', 'willian', 'wilmar', 'wilson', 'wladimir', 'wolney',
]);

const FEMALE_NAMES = new Set([
  'maria', 'ana', 'julia', 'júlia', 'juliana', 'joana', 'joão', 'laura', 'isabela', 'isabella',
  'beatriz', 'manuela', 'sofia', 'sofia', 'helena', 'alice', 'lara', 'valentina', 'heloísa',
  'heloisa', 'gabriela', 'gabrielle', 'yasmin', 'camila', 'vitória', 'vitoria', 'vitoria',
  'lorena', 'leticia', 'letícia', 'clara', 'fernanda', 'amanda', 'lais', 'laís', 'bruna',
  'carla', 'patrícia', 'patricia', 'vanessa', 'luciana', 'lucimara', 'aparecida', 'simone',
  'kátia', 'katia', 'eliane', 'tereza', 'teresinha', 'sonia', 'sônia', 'sonia', 'sandra',
  'marcia', 'márcia', 'rosângela', 'rosangela', 'cristina', 'lilian', 'lilia', 'marta',
  'ligia', 'lígia', 'judite', 'isabel', 'renata', 'cristiane', 'vanda', 'benedita',
  'josefa', 'neusa', 'wilma', 'vânia', 'vania', 'ivone', 'marlene', 'alzira', 'dulce',
  'elza', 'irma', 'irma', 'guilhermina', 'rosana', 'alexandra', 'daniela', 'nathalia',
  'nathália', 'nathalia', 'priscila', 'priscilla', 'carolina', 'caroline', 'bianca',
  'aline', 'aline', 'thais', 'thaís', 'tais', 'poliana', 'pollyana', 'esther', 'ester',
  'nicole', 'jessica', 'jéssica', 'jessica', 'mirela', 'mirella', 'sabrina', 'rafaela',
  'giovana', 'giovanna', 'marina', 'melissa', 'catarina', 'ludmila', 'larissa', 'luiza',
  'elisa', 'cecilia', 'cecília', 'luma', 'ayla', 'sara', 'zara', 'nina', 'maya',
  'liz', 'luna', 'aurora', 'eva', 'isadora', 'maite', 'maitê', 'malu', 'ana',
  'bella', 'elisa', 'eloa', 'eloá', 'flora', 'gaia', 'hannah', 'isis', 'kailany',
  'liz', 'lorena', 'manu', 'mel', 'nicole', 'olivia', 'olívia', 'pérola', 'perola',
  'raquel', 'rebeca', 'stella', 'valentina', 'yumi', 'ailda', 'alcione', 'alessandra',
  'alexandrina', 'alice', 'alzira', 'amelia', 'amélia', 'anaidia', 'analia', 'andreia',
  'anete', 'angelica', 'anita', 'anunciada', 'apolinaria', 'araide', 'arcanja',
  'ariane', 'arminda', 'assunção', 'assuncao', 'astrid', 'augusta', 'aurélia', 'aurelia',
  'barbara', 'benedita', 'branca', 'caetana', 'candida', 'carmen', 'carmem',
  'carminda', 'carmelita', 'carolina', 'cassia', 'catarina', 'cecilia', 'celeste',
  'celia', 'celsa', 'cintia', 'cibele', 'cidália', 'cidalia', 'cileide', 'cirene',
  'clarice', 'claudete', 'claudia', 'cleonice', 'conceição', 'conceicao', 'consuelo',
  'corina', 'cristiana', 'cristiane', 'custodia', 'dalia', 'dália', 'dalva',
  'daniele', 'danielle', 'dayse', 'deise', 'dejanira', 'delfina', 'delfinja', 'denise',
  'desiree', 'diamantina', 'diana', 'diná', 'dina', 'dione', 'djanira', 'dolores',
  'doralice', 'dora', 'dort', 'dulce', 'ceiça', 'eci', 'edilene', 'edna',
  'edwirges', 'eiza', 'elaine', 'elci', 'eleonora', 'eliane', 'elina', 'elisabete',
  'elisabeti', 'elizabete', 'elizandra', 'elke', 'elodia', 'elsa', 'elza',
  'ema', 'emanuelle', 'emilia', 'emily', 'emilly', 'ester', 'estela',
  'eulalia', 'eunice', 'eva', 'evalda', 'evelin', 'evelyn', 'evila', 'fábia',
  'fabia', 'fabiana', 'fabíola', 'fabiola', 'fani', 'fatima', 'fátima', 'fauze',
  'felipa', 'fernanda', 'filomena', 'flavia', 'flávia', 'flor', 'flora',
  'francisca', 'frederica', 'gabriela', 'genebra', 'geni', 'genilda', 'geraldina',
  'gertrudes', 'gilda', 'gina', 'giovana', 'gisela', 'gislene', 'gládis', 'gladis',
  'gleice', 'glória', 'gloria', 'graziela', 'guacira', 'guedes', 'helena',
  'heliete', 'heliodora', 'henriqueta', 'heraclides', 'hercília', 'hercilia',
  'hidra', 'hilda', 'honorina', 'horacia', 'hosana', 'hulda', 'ianca',
  'ida', 'idalina', 'igara', 'ilka', 'ilsa', 'imaculada', 'inez', 'ingrid',
  'inocencia', 'iolanda', 'ione', 'iracema', 'irany', 'irene', 'iris',
  'irma', 'isabel', 'isaura', 'ise', 'isete', 'islene', 'isolda', 'isaura',
  'iva', 'ivana', 'ivete', 'ivone', 'jaciara', 'jacqueline', 'jade', 'jandira',
  'janete', 'janiele', 'janina', 'jaqueline', 'jéssica', 'jessica', 'joana',
  'joelma', 'jorge', 'joselia', 'josete', 'josiane', 'josina', 'juana',
  'judite', 'julia', 'juliana', 'julieta', 'juscelia', 'juvelina', 'kalia',
  'karen', 'karina', 'karla', 'katarina', 'katherine', 'katia', 'katiane',
  'katilen', 'katiuscia', 'keli', 'kelly', 'kelly', 'kely', 'késia', 'kesia',
  'kira', 'lais', 'larissa', 'laura', 'lavínia', 'lavinia', 'leandra',
  'leda', 'leia', 'leila', 'lema', 'lena', 'leocadia', 'leonora', 'leontina',
  'leticia', 'lia', 'lide', 'ligia', 'lilian', 'lilia', 'lilian', 'liliam',
  'lima', 'linda', 'lindalva', 'lindamir', 'lindaura', 'lindomar', 'lindonete',
  'linete', 'lisandra', 'lise', 'lisete', 'livia', 'loanda', 'loide', 'lola',
  'lorena', 'loreta', 'lorna', 'louise', 'luana', 'luciana', 'lucilene',
  'lucilia', 'lucimara', 'lucimar', 'lucira', 'lucrecia', 'luiza', 'luma',
  'luna', 'lurdes', 'luzia', 'lygia', 'madalena', 'madre', 'mafalda', 'magna',
  'magnólia', 'magnolia', 'maiana', 'maira', 'maíra', 'malvina', 'mara',
  'marcele', 'marcela', 'marcia', 'margareth', 'margarida', 'maria', 'maribel',
  'maricelia', 'marilda', 'marilei', 'marilene', 'marilia', 'marina', 'marinez',
  'marinez', 'marisa', 'maristela', 'mariusa', 'marlene', 'marta', 'martina',
  'mateus', 'matilde', 'mauricia', 'mavie', 'maxima', 'mayara', 'meire',
  'melina', 'melissa', 'mercedes', 'micaela', 'michelle', 'mila', 'milena',
  'millena', 'miloca', 'milton', 'mimi', 'minervina', 'mira', 'miriam',
  'mirian', 'miriane', 'mirtes', 'moema', 'monica', 'mônica', 'monique',
  'morena', 'muriel', 'mylene', 'nadia', 'nádia', 'nailde', 'nair', 'naíra',
  'nancy', 'nanci', 'naomi', 'nara', 'natalia', 'nathalia', 'nazarete',
  'neci', 'neide', 'neila', 'neiva', 'nelci', 'nelei', 'neli', 'neusa',
  'neyde', 'niara', 'nice', 'nicole', 'nidia', 'nilce', 'nilza', 'nina',
  'nivea', 'noemia', 'nora', 'norma', 'nubia', 'odete', 'odila', 'ofélia',
  'ofelia', 'olga', 'olimpia', 'olivia', 'oriana', 'osmarina', 'osvania',
  'otaviana', 'otilia', 'ouvidina', 'ozana', 'pamela', 'patricia', 'paula',
  'pauliana', 'perola', 'petra', 'pietra', 'pietra', 'poliana', 'polla',
  'priscila', 'queila', 'querida', 'quiteria', 'rafaela', 'raimunda', 'raissa',
  'ralfia', 'ramos', 'raquel', 'rayane', 'rebeca', 'regiane', 'regina',
  'rene', 'renilda', 'rejane', 'rita', 'roberta', 'roberta', 'rocinha',
  'rojanira', 'romilda', 'ronaldia', 'rosalia', 'rosana', 'rosangela',
  'rosani', 'rose', 'roseana', 'roseany', 'roseci', 'roseli', 'rosemar',
  'rosemeire', 'rosi', 'rosilda', 'rosimeire', 'rosina', 'rowena', 'rozeli',
  'rubia', 'rúbia', 'rubiane', 'rute', 'ruthe', 'sabina', 'sabrina',
  'salete', 'salvadora', 'sandra', 'sandrali', 'santina', 'sara', 'sarah',
  'saskia', 'selma', 'selmara', 'septimia', 'sibele', 'sidiane', 'silene',
  'silvana', 'silvia', 'simone', 'simony', 'sirlei', 'sirlene', 'socorro',
  'sofia', 'solange', 'sonia', 'sonia', 'soraia', 'stefanie', 'stela',
  'stella', 'suany', 'suelen', 'sueli', 'sueli', 'suzana', 'suzete',
  'suzi', 'sylene', 'tabata', 'taila', 'talia', 'talita', 'talitha',
  'tamara', 'tania', 'tanira', 'tarsila', 'tatiane', 'tauna', 'taís',
  'tais', 'tecla', 'telma', 'tereza', 'terezinha', 'thalita', 'thamires',
  'thayna', 'thays', 'thelma', 'thifany', 'ticiana', 'tifany', 'tiziane',
  'tsai', 'tulipa', 'ubiratan', 'ula', 'ulda', 'una', 'urania', 'ursula',
  'vagnera', 'valdeci', 'valdete', 'valdirene', 'valentina', 'valeria',
  'vânia', 'vanessa', 'vasti', 'vera', 'veridiana', 'veronica', 'vicki',
  'vicky', 'victoria', 'vilma', 'virginia', 'visitação', 'vitória',
  'vitoria', 'vivan', 'vladia', 'wagna', 'waleska', 'walkiria', 'wanda',
  'wanessa', 'wani', 'wanny', 'wara', 'welita', 'wellen', 'wellington',
  'weslaine', 'wesleyana', 'wilma', 'wilza', 'ylvia', 'yara', 'yasmin',
  'yasmim', 'yeda', 'yolanda', 'yone', 'yoshie', 'yumi', 'zanira',
  'zara', 'zélia', 'zelia', 'zelinda', 'zenaide', 'zeni', 'zenilda',
  'zilda', 'zilma', 'zulmira',
]);

// Common name endings that suggest gender in Portuguese
const MALE_ENDINGS = ['o', 'as', 'or', 'er', 'il', 'al', 'el', 'eu'];
const FEMALE_ENDINGS = ['a', 'eia', 'ice', 'ine', 'ade', 'ina', 'ura'];

export function inferGender(name: string): 'male' | 'female' | 'unknown' {
  const normalized = name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Check dataset first
  if (MALE_NAMES.has(normalized)) return 'male';
  if (FEMALE_NAMES.has(normalized)) return 'female';

  // Heuristic: check first name if full name
  const firstName = normalized.split(' ')[0];
  if (MALE_NAMES.has(firstName)) return 'male';
  if (FEMALE_NAMES.has(firstName)) return 'female';

  // Heuristic: check last 2 letters for common endings
  if (normalized.length >= 2) {
    const lastTwo = normalized.slice(-2);
    const lastOne = normalized.slice(-1);

    if (lastOne === 'a') return 'female';
    if (lastOne === 'o') return 'male';
    if (lastTwo === 'or') return 'male';
    if (lastTwo === 'om') return 'male';
  }

  return 'unknown';
}

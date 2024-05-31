module contract::deck {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext, sender};
    use std::string::{String, utf8};

    public struct CardDeck has key, store {
        id: UID,
        X0: vector<String>,
        X1: vector<String>,
        Y0: vector<String>,
        Y1: vector<String>,
        selector0: u256,
        selector1: u256,
    }

    public(package) fun init_deck(ctx: &mut TxContext): CardDeck{
        CardDeck {
            id :object::new(ctx),
            X0: vector[utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0")],
            X1: vector[
                utf8(b"5299619240641551281634865583518297030282874472190772894086521144482721001553"),
                utf8(b"10031262171927540148667355526369034398030886437092045105752248699557385197826"),
                utf8(b"2763488322167937039616325905516046217694264098671987087929565332380420898366"),
                utf8(b"12252886604826192316928789929706397349846234911198931249025449955069330867144"),
                utf8(b"11480966271046430430613841218147196773252373073876138147006741179837832100836"),
                utf8(b"10483991165196995731760716870725509190315033255344071753161464961897900552628"),
                utf8(b"20092560661213339045022877747484245238324772779820628739268223482659246842641"),
                utf8(b"7582035475627193640797276505418002166691739036475590846121162698650004832581"),
                utf8(b"4705897243203718691035604313913899717760209962238015362153877735592901317263"),
                utf8(b"153240920024090527149238595127650983736082984617707450012091413752625486998"),
                utf8(b"21605515851820432880964235241069234202284600780825340516808373216881770219365"),
                utf8(b"13745444942333935831105476262872495530232646590228527111681360848540626474828"),
                utf8(b"2645068156583085050795409844793952496341966587935372213947442411891928926825"),
                utf8(b"6271573312546148160329629673815240458676221818610765478794395550121752710497"),
                utf8(b"5958787406588418500595239545974275039455545059833263445973445578199987122248"),
                utf8(b"20535751008137662458650892643857854177364093782887716696778361156345824450120"),
                utf8(b"13563836234767289570509776815239138700227815546336980653685219619269419222465"),
                utf8(b"4275129684793209100908617629232873490659349646726316579174764020734442970715"),
                utf8(b"3580683066894261344342868744595701371983032382764484483883828834921866692509"),
                utf8(b"18524760469487540272086982072248352918977679699605098074565248706868593560314"),
                utf8(b"2154427024935329939176171989152776024124432978019445096214692532430076957041"),
                utf8(b"1816241298058861911502288220962217652587610581887494755882131860274208736174"),
                utf8(b"3639172054127297921474498814936207970655189294143443965871382146718894049550"),
                utf8(b"18153584759852955321993060909315686508515263790058719796143606868729795593935"),
                utf8(b"5176949692172562547530994773011440485202239217591064534480919561343940681001"),
                utf8(b"11782448596564923920273443067279224661023825032511758933679941945201390953176"),
                utf8(b"15115414180166661582657433168409397583403678199440414913931998371087153331677"),
                utf8(b"16103312053732777198770385592612569441925896554538398460782269366791789650450"),
                utf8(b"15634573854256261552526691928934487981718036067957117047207941471691510256035"),
                utf8(b"13522014300368527857124448028007017231620180728959917395934408529470498717410"),
                utf8(b"8849597151384761754662432349647792181832839105149516511288109154560963346222"),
                utf8(b"17637772869292411350162712206160621391799277598172371975548617963057997942415"),
                utf8(b"17865442088336706777255824955874511043418354156735081989302076911109600783679"),
                utf8(b"9625567289404330771610619170659567384620399410607101202415837683782273761636"),
                utf8(b"19373814649267709158886884269995697909895888146244662021464982318704042596931"),
                utf8(b"7390138716282455928406931122298680964008854655730225979945397780138931089133"),
                utf8(b"15569307001644077118414951158570484655582938985123060674676216828593082531204"),
                utf8(b"5574029269435346901610253460831153754705524733306961972891617297155450271275"),
                utf8(b"19413618616187267723274700502268217266196958882113475472385469940329254284367"),
                utf8(b"4150841881477820062321117353525461148695942145446006780376429869296310489891"),
                utf8(b"13006218950937475527552755960714370451146844872354184015492231133933291271706"),
                utf8(b"2756817265436308373152970980469407708639447434621224209076647801443201833641"),
                utf8(b"20753332016692298037070725519498706856018536650957009186217190802393636394798"),
                utf8(b"18677353525295848510782679969108302659301585542508993181681541803916576179951"),
                utf8(b"14183023947711168902945925525637889799656706942453336661550553836881551350544"),
                utf8(b"9918129980499720075312297335985446199040718987227835782934042132813716932162"),
                utf8(b"13387158171306569181335774436711419178064369889548869994718755907103728849628"),
                utf8(b"6746289764529063117757275978151137209280572017166985325039920625187571527186"),
                utf8(b"17386594504742987867709199123940407114622143705013582123660965311449576087929"),
                utf8(b"11393356614877405198783044711998043631351342484007264997044462092350229714918"),
                utf8(b"16257260290674454725761605597495173678803471245971702030005143987297548407836"),
                utf8(b"3673082978401597800140653084819666873666278094336864183112751111018951461681"),
            ],
            Y0: vector[utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0")],
            Y1: vector[utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0"), utf8(b"0")],
            selector0: 4503599627370495,
            selector1: 3075935501959818,
        }
    }

    public(package) fun set_selector0(deck: &mut CardDeck, selector0: u256) {
        deck.selector0 = selector0;
    }
    public(package) fun set_selector1(deck: &mut CardDeck, selector1: u256) {
        deck.selector1 = selector1;
    }
    public(package) fun set_X0(deck: &mut CardDeck, deck_X0: vector<String>) {
        deck.X0 = deck_X0;
    }
    public(package) fun set_Y0(deck: &mut CardDeck, deck_Y0: vector<String>) {
        deck.Y0 = deck_Y0;
    }
    public(package) fun set_X1(deck: &mut CardDeck, deck_X1: vector<String>) {
        deck.X1 = deck_X1;
    }
    public(package) fun set_Y1(deck: &mut CardDeck, deck_Y1: vector<String>) {
        deck.Y1 = deck_Y1;
    }
    public(package) fun mod_X0(deck: &mut CardDeck, vals: &vector<String>, range: &vector<u64>) {
        // assert!(range.length() == 2);
        let mut i = 0;
        let offset = range[0];
        while ((i + offset) <= range[1]) {
            *deck.X0.borrow_mut(offset+i) = vals[i];
            i = i + 1;
        };
    }

    public(package) fun mod_Y0(deck: &mut CardDeck, vals: &vector<String>, range: &vector<u64>) {
        // assert!(range.length() == 2);
        let mut i = 0;
        let offset = range[0];
        while ((i + offset) <= range[1]) {
            *deck.Y0.borrow_mut(offset+i) = vals[i];
            i = i + 1;
        };
    }

    public(package) fun mod_X1(deck: &mut CardDeck, vals: &vector<String>, range: &vector<u64>) {
        // assert!(range.length() == 2);
        let mut i = 0;
        let offset = range[0];
        while ((i + offset) <= range[1]) {
            *deck.X1.borrow_mut(offset+i) = vals[i];
            i = i + 1;
        };
    }

    public(package) fun mod_Y1(deck: &mut CardDeck, vals: &vector<String>, range: &vector<u64>) {
        // assert!(range.length() == 2);
        let mut i = 0;
        let offset = range[0];
        while ((i + offset) <= range[1]) {
            *deck.Y1.borrow_mut(offset+i) = vals[i];
            i = i + 1;
        };
    }
}
module contract::game_state {
    use std::string::{Self, String};
    use sui::bcs::to_bytes;
    // use sui
    use sui::object::{Self,UID, ID};
    use sui::transfer::{share_object, transfer};
    use sui::tx_context::{Self, TxContext, sender};
    use sui::event::emit;
    use sui::table::{Table, Self};
    use sui::table_vec::push_back;
    // use sui::math;
    use contract::deck::{Self, CardDeck};
    // constant
    // game state
    const Join:u8 = 1;
    const Regist:u8 = 2; // pk
    const Shuffle: u8 = 3;
    const Deal: u8 = 4;
    const Open: u8 = 5;
    const Drop: u8 = 6;
    const See: u8 = 7;
    const GameError: u8 = 8;
    const Complete: u8 = 9;

    // game config
    // const CardsNum: u8 = 52;
    const PlayerNum: u64 = 3;
    // const LordNum: u8=1;
    // const FarmerNum: u8=2;
    const RoleLord: u64=0;
    const RoleFarmer: u64=1;

    const IndexLord: u64=0;
    const IndexFarmerOne: u64=1;
    const IndexFarmerTwo: u64=2;
    // AB 0 15 -> C(2)
    // AC 16 31 -> B(1)
    // bc 32 51 -> A(0)
    // players open cards offchain at 1 for themselfs, while other players will first decrypt cards for them
    const CardsDealRuleBit: vector<u256> = vector[0xFFFFF00000000, 0xFFFF0000, 0xFFFF];
    const CardsDealRule: vector<vector<u64>> = vector[vector[32, 51], vector[16, 31], vector[0, 15]];
    const CardsDecryptRule: vector<vector<u64>> = vector[vector[1, 2], vector[0, 2], vector[0, 1]];

    // struct
    public struct PlayerWaitList has key {
        id: UID,
        lords: vector<address>,
        farmers: vector<address>,
    }
    public struct RoomState has key {
        id: UID,
        state: u8,
        player_addrs: vector<address>, // lord idx = 0
        cur_player_idx: u64,
        registed_players: vector<address>, // prevent regist twice, since regist is paralle. donot use in other places
        pk: Pk,
        card_deck: CardDeck,
        deal_idx: u64,
        decrypt_idx: u64,
    }
    public struct Pk has key, store {
        id: UID,
        x0: String,
        y0: String,
        x1: String,
        y1: String,
        x2: String,
        y2: String,
    }
    // event
    public struct PlayerEvent has copy, drop {
        room_state_id: address,
        to_addr: vector<address>,
        action: u8,
        cards: u256,
        is_first_decryption: bool
    }
    public struct RegistrationEvent has copy, drop {
        room_state_id: address,
        to_addr: vector<address>,
        pk_x0: String,
        pk_y0: String,
        pk_x1: String,
        pk_y1: String,
        pk_x2: String,
        pk_y2: String,
    }
    public entry fun emit_dummy_PlayerEvent( room_state_id: address, to_addr: address, action: u8, cards: u256, is_first_decryption: bool) {
        emit({
            PlayerEvent {
                room_state_id, to_addr: vector[to_addr], action, cards, is_first_decryption
            }
        })
    }
    public entry fun emit_dummy_RegistrationEvent( room_state_id: address, to_addr: address, pk_x0: String, pk_y0: String, pk_x1: String, pk_y1: String, pk_x2: String, pk_y2: String) {
        emit({
            RegistrationEvent {
                room_state_id, to_addr: vector[to_addr], pk_x0, pk_y0, pk_x1, pk_y1, pk_x2, pk_y2
            }
        })
    }
    // error
    const EInvalidCall: u64 = 0;
    // fun
    fun init(ctx: &mut TxContext) {
        let player_wait_list = PlayerWaitList {
            id: object::new(ctx),
            lords: vector[],
            farmers: vector[],
        };
        share_object(player_wait_list);
    }
    // step 1. select role and join game
    public entry fun join_game(player_wait_list: &mut PlayerWaitList, role: u64, ctx: &mut TxContext) {
        assert!(!player_wait_list.lords.contains(&sender(ctx)), EInvalidCall);
        assert!(!player_wait_list.farmers.contains(&sender(ctx)), EInvalidCall);
        if (role == RoleLord) {
            if (player_wait_list.farmers.length() > 1) {
                let f1 = player_wait_list.farmers.pop_back();
                let f2 = player_wait_list.farmers.pop_back();
                create_game(vector[sender(ctx), f1, f2], ctx);
            } else {
                player_wait_list.lords.push_back(sender(ctx));
            }
        } else {
            if (player_wait_list.lords.length() > 0 && player_wait_list.farmers.length() > 0) {
                let lord = player_wait_list.lords.pop_back();
                let f1 = player_wait_list.farmers.pop_back();
                create_game(vector[lord, f1, sender(ctx)], ctx);
            } else {
                player_wait_list.farmers.push_back(sender(ctx));
            }
        }
    }
    fun create_game(player_addrs: vector<address>, ctx: &mut TxContext) {
        let room_state = RoomState {
            id: object::new(ctx),
            state: Regist,
            player_addrs: player_addrs,
            cur_player_idx: 0,
            registed_players: vector[],
            pk: Pk {
                id: object::new(ctx),
                x0: string::utf8(b""),
                y0: string::utf8(b""),
                x1: string::utf8(b""),
                y1: string::utf8(b""),
                x2: string::utf8(b""),
                y2: string::utf8(b""),
            },
            card_deck: deck::init_deck(ctx),
            deal_idx: 0,
            decrypt_idx: 0,
        };
        emit(PlayerEvent {
            room_state_id: object::id_to_address(object::borrow_id(&room_state)),
            to_addr: player_addrs,
            action: Regist,
            cards: 0,
            is_first_decryption: false,
        });
        share_object(room_state);
    }
    // step2. register pk to enter game
    public entry fun registe_pk(room_state: &mut RoomState, pk_x: String, pk_y: String, ctx: &mut TxContext) {
        assert!(room_state.state == Regist, EInvalidCall);
        assert!(room_state.player_addrs.contains(&sender(ctx)), EInvalidCall);
        assert!(!room_state.registed_players.contains(&sender(ctx)), EInvalidCall);
        room_state.registed_players.push_back(sender(ctx));
        // todo: valid pk on ecc
        if (sender(ctx) == room_state.player_addrs[0]) {
            room_state.pk.x0 = pk_x;
            room_state.pk.y0 = pk_y;
        } else if(sender(ctx) == room_state.player_addrs[1]) {
            room_state.pk.x1 = pk_x;
            room_state.pk.y1 = pk_y;
        } else if (sender(ctx) == room_state.player_addrs[2]) {
            room_state.pk.x2 = pk_x;
            room_state.pk.y2 = pk_y;
        };
        if (room_state.registed_players.length() == PlayerNum) {
            room_state.state = Shuffle;
            room_state.cur_player_idx = IndexLord;
            let pk = &room_state.pk;
            emit({
                RegistrationEvent {
                    room_state_id: object::id_to_address(object::borrow_id(room_state)),
                    to_addr: room_state.player_addrs,
                    pk_x0: pk.x0,
                    pk_y0: pk.y0,
                    pk_x1: pk.x1,
                    pk_y1: pk.y1,
                    pk_x2: pk.x2,
                    pk_y2: pk.y2,
                }
            });

            emit(PlayerEvent {
                room_state_id: object::id_to_address(object::borrow_id(room_state)),
                to_addr: vector[room_state.player_addrs[room_state.cur_player_idx]],
                action: Shuffle,
                cards: 0,
                is_first_decryption: false,
            })
        }
    }
    // step 3. shuflle order is lord->farmer1->farmer2
    public fun shuffle_cards(
        room_state: &mut RoomState,
        deck_X0: vector<String>,
        deck_X1: vector<String>,
        selector0: u256,
        selector1: u256,
        vk_bytes: vector<u8>,
        public_inputs_bytes: vector<u8>,
        proof_points_bytes: vector<u8>,
        ctx: &mut TxContext)
    {
        assert!(room_state.state == Shuffle, EInvalidCall);
        assert!(room_state.player_addrs[room_state.cur_player_idx] == sender(ctx), EInvalidCall);
        // todo verify zkp
        room_state.card_deck.set_X0(deck_X0);
        room_state.card_deck.set_X1(deck_X1);
        room_state.card_deck.set_selector0(selector0);
        room_state.card_deck.set_selector1(selector1);

        if (room_state.cur_player_idx == (PlayerNum - 1)) {
            room_state.state = Deal;
            room_state.deal_idx = 0;
            room_state.decrypt_idx = 0;
            room_state.cur_player_idx = CardsDecryptRule[room_state.deal_idx][room_state.decrypt_idx]; //IndexFarmerOne
            emit(PlayerEvent {
                room_state_id: object::id_to_address(object::borrow_id(room_state)),
                to_addr: vector[room_state.player_addrs[room_state.cur_player_idx]],
                action: Deal,
                cards: CardsDealRuleBit[room_state.deal_idx],
                is_first_decryption: true,
            });
        } else {
            let (_, next_player_addr) = rotate_next_player(room_state);
            emit(PlayerEvent {
                room_state_id: object::id_to_address(object::borrow_id(room_state)),
                to_addr: vector[next_player_addr],
                action: Shuffle,
                cards: 0,
                is_first_decryption: false,
            });
        };
    }
    // step 4. deal all, order is lord->farmer1->farmer2
    // after deal, player can see their own card immediatly
    entry fun deal_cards(room_state: &mut RoomState,
                         deck_X0: vector<String>,
                         deck_Y0: vector<String>,
                         deck_X1: vector<String>,
                         deck_Y1: vector<String>,
                         vk_bytes: vector<u8>,
                         public_inputs_bytes: vector<u8>,
                         proof_points_bytes: vector<u8>,
                         ctx: &mut TxContext)
    {
        assert!(room_state.state == Deal, EInvalidCall);
        assert!(room_state.player_addrs[room_state.cur_player_idx] == sender(ctx), EInvalidCall);
        // todo verify zkp
        let mut msg_is_first_decryption = false;
        // let card_deck = &mut room_state.card_deck;
        let range = &CardsDealRule[room_state.deal_idx];
        if (room_state.cur_player_idx == CardsDecryptRule[room_state.deal_idx][0]) {
            room_state.card_deck.mod_X0(&deck_X0, range);
            room_state.card_deck.mod_Y0(&deck_Y0, range);
            room_state.card_deck.mod_X1(&deck_X1, range);
            room_state.card_deck.mod_Y1(&deck_Y1, range);
        } else {
            room_state.card_deck.mod_X1(&deck_X1, range);
            room_state.card_deck.mod_Y1(&deck_Y1, range);
        };
        room_state.decrypt_idx = room_state.decrypt_idx + 1;
        if (room_state.decrypt_idx == CardsDecryptRule[room_state.deal_idx].length())
        {
            room_state.deal_idx = room_state.deal_idx + 1;
            room_state.decrypt_idx = 0;
            msg_is_first_decryption = true;
        };
        if (room_state.deal_idx == PlayerNum) {
            room_state.state = Drop;
            room_state.cur_player_idx = IndexLord;
            let mut i = 0;
            while(i < PlayerNum) { // open card at same time
                emit(PlayerEvent {
                    room_state_id: object::id_to_address(object::borrow_id(room_state)),
                    to_addr: vector[room_state.player_addrs[i]],
                    action: Open, // who to open what
                    cards: CardsDealRuleBit[i],
                    is_first_decryption: false,
                });
                i = i + 1;
            };
            emit(PlayerEvent {
                room_state_id: object::id_to_address(object::borrow_id(room_state)),
                to_addr: vector[room_state.player_addrs[room_state.cur_player_idx]],
                action: Drop, // who to drop
                cards: 0,
                is_first_decryption: false,
            });
            return
        };
        room_state.cur_player_idx = CardsDecryptRule[room_state.deal_idx][room_state.decrypt_idx];
        emit(PlayerEvent {
            room_state_id: object::id_to_address(object::borrow_id(room_state)),
            to_addr: vector[room_state.player_addrs[room_state.cur_player_idx]],
            action: Deal,
            cards: CardsDealRuleBit[room_state.deal_idx],
            is_first_decryption: msg_is_first_decryption,
        });
    }
    // step 5: drop cards
    public entry fun drop_cards(room_state: &mut RoomState,
                                cards: u256,
                                vk_bytes: vector<u8>,
                                public_inputs_bytes: vector<u8>,
                                proof_points_bytes: vector<u8>,
                                ctx: &mut TxContext)
    {
        assert!(room_state.state == Drop, EInvalidCall);
        assert!(room_state.player_addrs[room_state.cur_player_idx] == sender(ctx), EInvalidCall);
        // zkp
        emit(PlayerEvent {
            room_state_id: object::id_to_address(object::borrow_id(room_state)),
            to_addr: vector[room_state.player_addrs[room_state.cur_player_idx]],
            action: See, // who drop what
            cards: cards,
            is_first_decryption: false,
        });
        let (_, next_player_addr) = rotate_next_player(room_state);
        emit(PlayerEvent {
            room_state_id: object::id_to_address(object::borrow_id(room_state)),
            to_addr: vector[next_player_addr],
            action: Drop, // who to drop
            cards: 0,
            is_first_decryption: false,
        });
    }
    // private function
    fun rotate_next_player(room_state: &mut RoomState): (u64, address) {
        room_state.cur_player_idx = (room_state.cur_player_idx + 1) % PlayerNum;
        (room_state.cur_player_idx, room_state.player_addrs[room_state.cur_player_idx])
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
    #[test]
    fun test_language_feature() {
        use sui::test_scenario;
        use std::debug;
        let admin = @0xAD;
        let (alice, bob, clarlie) = (@0xA, @0xB, @0xC);

        let mut scenario = test_scenario::begin(admin);
        {
            init_for_testing(scenario.ctx());
        };
        scenario.next_tx(alice);
        let mut player_wait_list = scenario.take_shared<PlayerWaitList>();
        {
            // step 1.
            join_game(&mut player_wait_list, 0,scenario.ctx());
        };
        scenario.next_tx(bob);
        {
            // step 2.
            join_game(&mut player_wait_list, 1,scenario.ctx());
        };
        scenario.next_tx(clarlie);
        {
            join_game(&mut player_wait_list, 1,scenario.ctx());
        };
        test_scenario::return_shared(player_wait_list);
        scenario.next_tx(alice);
        let mut room_state = scenario.take_shared<RoomState>();
        {
            registe_pk(&mut room_state,
                string::utf8(b"11480966271046430430613841218147196773252373073876138147006741179837832100836"),
                string::utf8(b"15148236048131954717802795400425086368006776860859772698778589175317365693546"),
                scenario.ctx()
            );
        };
        test_scenario::return_shared(room_state);
        scenario.end();
    }
}




























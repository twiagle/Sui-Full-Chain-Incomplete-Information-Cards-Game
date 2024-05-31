export const STATE_MANAGER_MODULE = "game_state";
// export const GAME_PACKAGE_ID =
// "0xf23079a2ad41d6c33561032b758f6eddc97837e8d8700e210de7ece3b16a55f9";
// export const PLAYER_WAITLIST_ID = "0x80a650c2a535579a316868481fc07075a5d88770a132bdb5b8ad6eb2fb640ee7";
export const network = "testnet";
export const GAME_PACKAGE_ID =
    "0x6f676d7c753ec053ecaa4f755b6130dbc62502ca24e715a1d0771211306cb35a";
export const PLAYER_WAITLIST_ID = "0x256ac3fe03714600b53c785bbdbbc10a58a6130125bf1e4a28d3d6b7679e6c11";

export const PLAYER_EVENT = `${GAME_PACKAGE_ID}::${STATE_MANAGER_MODULE}::PlayerEvent`;
export const REGISTRATION_EVENT = `${GAME_PACKAGE_ID}::${STATE_MANAGER_MODULE}::RegistrationEvent`;

export const JOIN_GAME = `${GAME_PACKAGE_ID}::${STATE_MANAGER_MODULE}::join_game`;
export const REGISTE_PK = `${GAME_PACKAGE_ID}::${STATE_MANAGER_MODULE}::registe_pk`;
export const SHUFFLE_CARDS = `${GAME_PACKAGE_ID}::${STATE_MANAGER_MODULE}::shuffle_cards`;
export const DEAL_CARDS = `${GAME_PACKAGE_ID}::${STATE_MANAGER_MODULE}::deal_cards`;
export const DROP_CARDS = `${GAME_PACKAGE_ID}::${STATE_MANAGER_MODULE}::drop_cards`;

export const ROOM_STATE_ID = "0x2746eda65f178f75826167214bc1267f6b984ea5e34b947687d5ccb5ac92e2ec"
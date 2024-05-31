use crate::modelds::ZkpConfig;
use std::collections::HashMap;

#[derive(Clone)]
pub struct AppState {
    pub zkp_config: HashMap<String, ZkpConfig>,
}

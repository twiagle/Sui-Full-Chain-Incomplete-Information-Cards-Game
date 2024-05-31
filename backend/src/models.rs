use ark_bn254::Bn254;
use ark_circom::CircomBuilder;
use ark_groth16::ProvingKey;
use serde::{Deserialize, Serialize};
// use num_bigint::BigInt;
use actix_web::web;
#[derive(Clone)]
pub struct ZkpConfig {
    pub builder: CircomBuilder<Bn254>,
    pub proving_key: ProvingKey<Bn254>,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct ZkpRequest {
    pub api: String,
    pub names: Vec<String>,
    pub vals: Vec<String>,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Proof {
    pub vk_bytes: String,
    pub public_inputs_bytes: String,
    pub proof_points_bytes: String,
}

impl From<web::Json<ZkpRequest>> for ZkpRequest {
    fn from(zkp_reqest: web::Json<ZkpRequest>) -> Self {
        ZkpRequest {
            api: zkp_reqest.api.clone(),
            names: zkp_reqest.names.clone(),
            vals: zkp_reqest.vals.clone(),
        }
    }
}

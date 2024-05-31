use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use ark_bn254::Bn254;
use ark_circom::CircomBuilder;
use ark_circom::CircomCircuit;
use ark_circom::CircomConfig;
use ark_groth16::Groth16;
use ark_groth16::{ProvingKey, VerifyingKey};
use ark_serialize::CanonicalSerialize;
use ark_snark::SNARK;
use base64::{engine::general_purpose, Engine as _};
use num_bigint::BigInt;
use rand::rngs::ThreadRng;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use web::Data;

#[path = "../handlers.rs"]
mod handlers;
#[path = "../models.rs"]
mod modelds;
#[path = "../routers.rs"]
mod routers;
#[path = "../state.rs"]
mod state;

use modelds::ZkpConfig;
use routers::*;
use state::AppState;

pub struct CircomFile {
    pub wasm: String,
    pub r1cs: String,
}

fn setup_zkp(circom_file: &CircomFile) -> ZkpConfig {
    println!("wasm {:?}", &circom_file.wasm);
    println!("r1cs {:?}", &circom_file.wasm);

    let start_time = Instant::now();
    // Load the WASM and R1CS for witness and proof generation
    let cfg = CircomConfig::<Bn254>::new(&circom_file.wasm, &circom_file.r1cs).unwrap();

    let builder = CircomBuilder::new(cfg);
    let circom = builder.setup();
    let mut rng = rand::thread_rng();
    let proving_key =
        Groth16::<Bn254>::generate_random_parameters_with_reduction(circom, &mut rng).unwrap();
    let end_time = Instant::now();
    let duration = end_time - start_time;
    println!("generate circom {:?}", duration.as_secs());

    let setup_config = ZkpConfig {
        builder: builder,
        proving_key: proving_key,
    };
    setup_config
}

#[actix_rt::main]
async fn main() -> io::Result<()> {
    let base_dir = String::from("/home/cleversushi/sui_projects/Sui-Full-Chain-Incomplete-Information-Cards-Game/zkshuffle/build");
    let mut app_state = AppState {
        zkp_config: HashMap::new(),
    };
    for api in ["suitest", "shuffle_encrypt", "decrypt"] {
        let circom_file = CircomFile {
            wasm: format!("{0}/{1}_js/{1}.wasm", base_dir, api),
            r1cs: format!("{0}/{1}.r1cs", base_dir, api),
        };
        let zkp_config = setup_zkp(&circom_file);
        app_state.zkp_config.insert(String::from(api), zkp_config);
    }

    let shared_data = Arc::new(app_state);
    let app = move || {
        App::new()
            .app_data(web::Data::new(Arc::clone(&shared_data)))
            .configure(general_routes)
    };
    HttpServer::new(app).bind("127.0.0.1:3000")?.run().await
}

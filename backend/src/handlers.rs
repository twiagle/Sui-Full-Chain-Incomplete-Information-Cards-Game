use super::state::AppState;
use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use ark_bn254::Bn254;
use ark_circom::CircomBuilder;
use ark_circom::CircomCircuit;
use ark_circom::CircomConfig;
use ark_groth16::Groth16;
use ark_serialize::CanonicalSerialize;
use ark_snark::SNARK;
use base64::{engine::general_purpose, Engine as _};
use serde::{Deserialize, Serialize};

use crate::modelds::{Proof, ZkpRequest};
use ark_groth16::{ProvingKey, VerifyingKey};
use num_bigint::BigInt;
use std::str::FromStr;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use web::Data;

pub async fn zkp(state: Data<Arc<AppState>>, zkp_request: web::Json<ZkpRequest>) -> impl Responder {
    println!("message in");
    let api: &str = &zkp_request.api;
    let mut zkp_config = state.zkp_config.get(api).unwrap().clone();
    let start_time = Instant::now();
    for i in 0..zkp_request.names.len() {
        zkp_config.builder.push_input(
            &zkp_request.names[i],
            BigInt::from_str(&zkp_request.vals[i]).unwrap(),
        );
    }
    let circom = zkp_config.builder.build().unwrap();
    let inputs = circom.get_public_inputs().unwrap();
    let end_time = Instant::now();
    println!("build circom {:?}", (end_time - start_time).as_secs());

    // Generate the proof
    let start_time = Instant::now();
    let mut rng = rand::thread_rng();
    let proof = Groth16::<Bn254>::prove(&zkp_config.proving_key, circom, &mut rng).unwrap();
    let end_time = Instant::now();
    println!("generate proof {:?}", (end_time - start_time).as_secs());

    // Check that the proof is valid
    // let pvk = Groth16::<Bn254>::process_vk(&params.vk).unwrap();
    // let verified = Groth16::<Bn254>::verify_with_processed_vk(&pvk, &inputs, &proof).unwrap();
    // assert!(verified);

    // serialize_compressed
    let start_time = Instant::now();
    let mut vk_bytes = Vec::new();
    zkp_config
        .proving_key
        .vk
        .serialize_compressed(&mut vk_bytes)
        .unwrap();

    let mut public_inputs_bytes = Vec::new();
    for i in 0..inputs.len() {
        // if there is more than one public input, serialize one by one
        inputs[i]
            .serialize_compressed(&mut public_inputs_bytes)
            .unwrap();
    }

    let mut proof_points_bytes = Vec::new();
    proof.serialize_compressed(&mut proof_points_bytes).unwrap();

    let end_time = Instant::now();
    println!(
        "serialize_compressed {:?}",
        (end_time - start_time).as_secs()
    );

    // let (vk_bytes, public_inputs_bytes, proof_points_bytes) = get_proof(&mut setup_config);
    // serialize_compressed to base64
    let proof = Proof {
        vk_bytes: general_purpose::STANDARD.encode(&vk_bytes),
        public_inputs_bytes: general_purpose::STANDARD.encode(&public_inputs_bytes),
        proof_points_bytes: general_purpose::STANDARD.encode(&proof_points_bytes),
    };

    HttpResponse::Ok().json(proof)
}

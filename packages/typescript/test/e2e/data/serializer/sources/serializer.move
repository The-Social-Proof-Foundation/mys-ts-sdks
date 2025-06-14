// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

module serializer::serializer_tests;

use std::ascii;
use std::string::String;
use sui::clock::Clock;

public struct MutableShared has key {
    id: UID,
    value: u64,
}

fun init(ctx: &mut TxContext) {
    transfer::share_object(MutableShared {
        id: object::new(ctx),
        value: 1,
    })
}

public entry fun use_clock(_clock: &Clock) {}

public entry fun list<T: key + store>(item: T, ctx: &mut TxContext) {
    transfer::public_transfer(item, tx_context::sender(ctx))
}

public fun return_struct<T: key + store>(item: T): T {
    item
}

public entry fun value(clock: &MutableShared) {
    assert!(clock.value > 0, 1);
}

public entry fun set_value(clock: &mut MutableShared) {
    clock.value = 10;
}

public entry fun delete_value(clock: MutableShared) {
    let MutableShared { id, value: _ } = clock;
    object::delete(id);
}

public fun test_abort() {
    abort 0
}

public fun addr(_: address) {}

public fun id(_: ID) {}

public fun ascii_(_: ascii::String) {}

public fun string(_: String) {}

public fun vec(_: vector<ascii::String>) {}

public fun opt(_: Option<ascii::String>) {}

public fun ints(
    _u8: u8,
    _u16: u16,
    _u32: u32,
    _u64: u64,
    _u128: u128,
    _u256: u256,
) {}

public fun boolean(_bool: bool) {}

public fun some<T>(opt: Option<T>): T {
    opt.destroy_some()
}

public fun none<T>(opt: Option<T>) {
    opt.destroy_none()
}

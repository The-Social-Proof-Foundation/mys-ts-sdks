// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

module hero::hero;

use sui::package;

public struct Hero has key, store {
    id: UID,
    level: u8,
}

public struct Villain has key, store {
    id: UID,
}

public struct HERO has drop {}

fun init(witness: HERO, ctx: &mut TxContext) {
    package::claim_and_keep(witness, ctx);
}

public fun mint_hero(ctx: &mut TxContext): Hero {
    Hero {
        id: object::new(ctx),
        level: 1,
    }
}

public fun mint_villain(ctx: &mut TxContext): Villain {
    Villain {
        id: object::new(ctx),
    }
}

public fun level_up(hero: &mut Hero) {
    hero.level = hero.level + 1;
}

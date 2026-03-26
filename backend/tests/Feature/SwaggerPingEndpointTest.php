<?php

test('the swagger ping endpoint returns pong', function () {
    $response = $this->getJson('/api/v1/ping');

    $response->assertOk()
        ->assertJson([
            'message' => 'pong',
        ]);
});

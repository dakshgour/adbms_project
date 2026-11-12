def test_cart_workflow(client, customer_token):
    headers = {"Authorization": f"Bearer {customer_token}"}

    # 1. Clear cart
    client.post("/api/v1/cart/clear", headers=headers)

    # 2. Add product 1 to cart
    res = client.post("/api/v1/cart/items", headers=headers, json={
        "product_id": 1,
        "quantity": 1
    })
    assert res.status_code == 200
    cart = res.get_json()["data"]
    assert len(cart["items"]) == 1
    item_id = cart["items"][0]["cart_item_id"]
    assert cart["items"][0]["quantity"] == 1

    # 3. Update quantity
    update_res = client.put(f"/api/v1/cart/items/{item_id}", headers=headers, json={
        "quantity": 2
    })
    assert update_res.status_code == 200
    updated_cart = update_res.get_json()["data"]
    assert updated_cart["items"][0]["quantity"] == 2

    # 4. Remove item
    del_res = client.delete(f"/api/v1/cart/items/{item_id}", headers=headers)
    assert del_res.status_code == 200
    empty_cart = del_res.get_json()["data"]
    assert len(empty_cart["items"]) == 0

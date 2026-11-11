def test_feynman_technique_workflow(client, test_user, other_user):
    # 1. Create Feynman note
    create_res = client.post(
        "/api/v1/learning/feynman",
        headers=test_user["headers"],
        json={
            "concept_title": "Heisenberg Uncertainty Principle",
            "target_audience": "A 10-year old",
            "explanation": "You cannot measure both where a tiny particle is and where it is going at the exact same time.",
            "identified_gaps": "Need better clarity on wave-particle duality.",
            "simplified_analogy": "Like trying to take a sharp photo of a fast-spinning fan blade.",
        },
    )
    assert create_res.status_code == 201
    note = create_res.json()
    assert note["concept_title"] == "Heisenberg Uncertainty Principle"
    note_id = note["id"]

    # 2. List notes for User A
    list_res = client.get("/api/v1/learning/feynman", headers=test_user["headers"])
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

    # 3. Isolation: User B cannot see User A's notes
    other_list = client.get("/api/v1/learning/feynman", headers=other_user["headers"])
    assert other_list.status_code == 200
    assert len(other_list.json()) == 0

    other_get = client.get(f"/api/v1/learning/feynman/{note_id}", headers=other_user["headers"])
    assert other_get.status_code == 404

    # 4. Update note
    update_res = client.patch(
        f"/api/v1/learning/feynman/{note_id}",
        headers=test_user["headers"],
        json={"simplified_analogy": "A basketball bouncing in a pitch black room."},
    )
    assert update_res.status_code == 200
    assert update_res.json()["simplified_analogy"] == "A basketball bouncing in a pitch black room."

    # 5. Delete note
    del_res = client.delete(f"/api/v1/learning/feynman/{note_id}", headers=test_user["headers"])
    assert del_res.status_code == 204


def test_braindump_session(client, test_user):
    res = client.post(
        "/api/v1/learning/brain-dump",
        headers=test_user["headers"],
        json={
            "title": "Krebs Cycle Free Recall",
            "content": "Acetyl-CoA combines with oxaloacetate to form citrate. Citrate is converted to isocitrate...",
            "duration_seconds": 600,
            "knowledge_gaps": "Forgot the enzyme catalyzing alpha-ketoglutarate oxidation.",
        },
    )
    assert res.status_code == 201
    dump = res.json()
    assert dump["title"] == "Krebs Cycle Free Recall"
    assert dump["duration_seconds"] == 600

    list_res = client.get("/api/v1/learning/brain-dump", headers=test_user["headers"])
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1


def test_mindmap_persistence(client, test_user):
    graph = {
        "nodes": [
            {"id": "root", "text": "Computer Networks", "x": 0, "y": 0, "isRoot": True},
            {"id": "node-1", "text": "OSI 7 Layers", "x": 100, "y": -50},
            {"id": "node-2", "text": "TCP/IP Protocol", "x": 100, "y": 50},
        ],
        "connections": [
            {"from": "root", "to": "node-1"},
            {"from": "root", "to": "node-2"},
        ],
    }
    create_res = client.post(
        "/api/v1/learning/mind-maps",
        headers=test_user["headers"],
        json={"title": "Networking Fundamentals", "graph_data": graph},
    )
    assert create_res.status_code == 201
    mind_map = create_res.json()
    assert mind_map["title"] == "Networking Fundamentals"
    assert len(mind_map["graph_data"]["nodes"]) == 3
    map_id = mind_map["id"]

    # Update graph data
    graph["nodes"].append({"id": "node-3", "text": "Routing Algorithms", "x": 200, "y": 0})
    patch_res = client.patch(
        f"/api/v1/learning/mind-maps/{map_id}",
        headers=test_user["headers"],
        json={"graph_data": graph},
    )
    assert patch_res.status_code == 200
    assert len(patch_res.json()["graph_data"]["nodes"]) == 4


def test_flashcards_sm2_progression(client, test_user, other_user):
    # 1. Create subject
    subj_res = client.post(
        "/api/v1/subjects",
        headers=test_user["headers"],
        json={"name": "Biology"},
    )
    subj_id = subj_res.json()["id"]

    # 2. Create flashcard
    card_res = client.post(
        "/api/v1/flashcards",
        headers=test_user["headers"],
        json={
            "subject_id": subj_id,
            "question": "What is the primary function of Mitochondria?",
            "answer": "Cellular respiration and ATP generation.",
        },
    )
    assert card_res.status_code == 201
    card = card_res.json()
    card_id = card["id"]
    assert card["repetitions"] == 0
    assert card["interval_days"] == 1
    assert card["ease_factor"] == 2.50

    # 3. Check due cards: new cards have next_review_at <= now, so it should be due!
    due_res = client.get("/api/v1/flashcards/due", headers=test_user["headers"])
    assert due_res.status_code == 200
    assert len(due_res.json()) >= 1

    # 4. First review with perfect recall (quality = 5)
    rev1 = client.post(
        f"/api/v1/flashcards/{card_id}/review",
        headers=test_user["headers"],
        json={"quality_rating": 5},
    )
    assert rev1.status_code == 200
    card1 = rev1.json()
    assert card1["repetitions"] == 1
    assert card1["interval_days"] == 1
    assert card1["ease_factor"] == 2.60  # 2.5 + (0.1 - 0)

    # 5. Second review with good recall (quality = 5)
    rev2 = client.post(
        f"/api/v1/flashcards/{card_id}/review",
        headers=test_user["headers"],
        json={"quality_rating": 5},
    )
    assert rev2.status_code == 200
    card2 = rev2.json()
    assert card2["repetitions"] == 2
    assert card2["interval_days"] == 6  # SM-2 rule: second repetition interval = 6 days!

    # 6. Third review with failed recall (quality = 2)
    rev3 = client.post(
        f"/api/v1/flashcards/{card_id}/review",
        headers=test_user["headers"],
        json={"quality_rating": 2},
    )
    assert rev3.status_code == 200
    card3 = rev3.json()
    assert card3["repetitions"] == 0  # Reset to 0 upon failure
    assert card3["interval_days"] == 1  # Reset to 1 day upon failure

    # 7. Isolation check: User B cannot review User A's card
    other_rev = client.post(
        f"/api/v1/flashcards/{card_id}/review",
        headers=other_user["headers"],
        json={"quality_rating": 5},
    )
    assert other_rev.status_code == 404

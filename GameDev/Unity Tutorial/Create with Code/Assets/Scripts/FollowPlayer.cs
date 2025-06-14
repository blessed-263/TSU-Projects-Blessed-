using UnityEngine;

public class FollowPlayer : MonoBehaviour
{
    private Vector3 offset = new Vector3(0, 7, -13);
    public GameObject player;

    void LateUpdate()
    {
        // Offset the camera behind the player by 7 units up and 13 units back
        transform.position = player.transform.position + offset;
    }
}
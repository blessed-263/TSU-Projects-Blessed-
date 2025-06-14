using UnityEngine;

public class PlayerController : MonoBehaviour
{

    //Private Variables
    private float speed = 10f;
   private float turnSpeed;
    private float horizontalInput;
    private float forwardInput;
    void Start()
    {
        
    }

    
    void Update()
    {
        //Get player input
        horizontalInput = Input.GetAxis("Horizontal");
        forwardInput = Input.GetAxis("Vertical");
        //Move vehicle forward
        transform.Translate(Vector3.forward * Time.deltaTime * speed * forwardInput);
        //Turn vehicle
        transform.Rotate(Vector3.up, turnSpeed * Time.deltaTime * horizontalInput);
    }
}

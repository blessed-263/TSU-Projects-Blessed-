using UnityEngine;

public class SpinPropellerX : MonoBehaviour
{
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        
    }


    void Update()
    {
        transform.Rotate(Vector3.forward * 100 * Time.deltaTime);
        
    }
}

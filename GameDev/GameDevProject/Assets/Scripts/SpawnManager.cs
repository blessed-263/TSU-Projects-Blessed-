using UnityEngine;
using System.Collections;

public class SpawnManager : MonoBehaviour
{
    public GameObject alienPrefab;      // Enemy prefab to spawn
    public float spawnRadius = 5f;      // Radius around this SpawnManager to spawn enemies
    public float spawnInterval = 3f;    // Time between spawns
    public int maxEnemies = 10;         // Max enemies spawned at this SpawnManager

    private int currentEnemyCount = 0;

    void Start()
    {
        StartCoroutine(SpawnRoutine());
    }

    IEnumerator SpawnRoutine()
    {
        while (true)
        {
            if (currentEnemyCount < maxEnemies)
            {
                SpawnAlien();
            }
            yield return new WaitForSeconds(spawnInterval);
        }
    }

    void SpawnAlien()
    {
        Vector3 spawnPos = transform.position + Random.insideUnitSphere * spawnRadius;
        spawnPos.y = transform.position.y; // Keep spawn on same height level

        GameObject alien = Instantiate(alienPrefab, spawnPos, Quaternion.identity);

        currentEnemyCount++;

        AlienController alienController = alien.GetComponent<AlienController>();
        if (alienController != null)
        {
            // Subscribe to OnDeath event to decrement count when alien dies
            alienController.OnDeath += () =>
            {
                currentEnemyCount = Mathf.Max(0, currentEnemyCount - 1);
            };
        }
        else
        {
            // If no AlienController, fallback: destroy after 30 seconds and decrement count
            Destroy(alien, 30f);
            StartCoroutine(DecreaseCountAfterDelay(30f));
        }
    }

    IEnumerator DecreaseCountAfterDelay(float delay)
    {
        yield return new WaitForSeconds(delay);
        currentEnemyCount = Mathf.Max(0, currentEnemyCount - 1);
    }
}

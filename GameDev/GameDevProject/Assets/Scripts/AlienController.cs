using UnityEngine;
using UnityEngine.AI;

public class AlienController : MonoBehaviour
{
    // Event to notify subscribers when this alien dies
    public event System.Action OnDeath;

    [Header("References")]
    public Transform target;           // Assign the player Transform in Inspector
    public NavMeshAgent agent;         // Assign or auto-find in parent
    public Animator animator;          // Assign or auto-find in parent

    [Header("AI Settings")]
    public float attackRange = 7f;
    public float attackCooldown = 1.5f;

    [Header("Health Settings")]
    public int maxHealth = 100;
    private int currentHealth;

    [Header("Movement Settings")]
    public float moveSpeed = 3f;
    public float rotationSpeed = 5f;

    [Header("Animation Settings")]
    public float animationSmoothTime = 0.1f;

    [Header("Effects")]
    public GameObject alienBloodPrefab; // Prefab for alien blood particle effect

    private bool isDead = false;
    private float lastAttackTime = -999f;
    private Vector3 lastTargetPosition;

    // Stagger mechanic: prevents attacking for 0.5s after hit
    private bool isStaggered = false;
    public float staggerDuration = 0.5f;

    // Death delay before destroying the alien (seconds)
    public float destroyDelay = 0.5f;

    // Delay before disabling agent and collider to allow death animation to play
    public float disableComponentsDelay = 1.5f; // Adjust to match death animation length

    void Start()
    {
        currentHealth = maxHealth;

        if (target == null)
        {
            Debug.LogError("AlienController: Target (player) not assigned!");
            enabled = false;
            return;
        }

        if (agent == null)
        {
            agent = GetComponentInParent<NavMeshAgent>();
            if (agent == null)
            {
                Debug.LogError("AlienController: NavMeshAgent not found in parent!");
                enabled = false;
                return;
            }
        }

        if (animator == null)
        {
            animator = GetComponentInParent<Animator>();
            if (animator == null)
            {
                Debug.LogError("AlienController: Animator not found in parent!");
                enabled = false;
                return;
            }
        }

        agent.speed = moveSpeed;
        agent.angularSpeed = rotationSpeed * 360f;
        agent.autoBraking = false;
        agent.stoppingDistance = attackRange * 0.9f;

        lastTargetPosition = target.position;
    }

    void Update()
    {
        if (isDead || target == null) return;

        Vector3 flatTargetPos = new Vector3(target.position.x, 0, target.position.z);
        Vector3 flatAlienPos = new Vector3(agent.transform.position.x, 0, agent.transform.position.z);
        float horizontalDistance = Vector3.Distance(flatTargetPos, flatAlienPos);

        // Update destination only if target moved significantly
        if (!agent.isStopped && Vector3.Distance(lastTargetPosition, target.position) > 0.1f)
        {
            agent.SetDestination(target.position);
            lastTargetPosition = target.position;
        }

        // Update animator speed parameter smoothly
        animator.SetFloat("Speed", agent.velocity.magnitude, animationSmoothTime, Time.deltaTime);

        // Attack if in range and not staggered
        if (!isStaggered && horizontalDistance <= attackRange)
        {
            TryAttack();
        }
        else if (agent.isStopped)
        {
            agent.isStopped = false;
        }
    }

    private void TryAttack()
    {
        if (Time.time - lastAttackTime < attackCooldown) return;

        animator.SetTrigger("HitTrigger");
        lastAttackTime = Time.time;
        agent.isStopped = true;

        float distanceToPlayer = Vector3.Distance(agent.transform.position, target.position);
        if (distanceToPlayer <= attackRange)
        {
            PlayerMovementController player = target.GetComponent<PlayerMovementController>();
            if (player != null)
            {
                player.TakeDamage(21);
                Debug.Log("Alien attacked player for 21 damage.");
            }
        }

        Invoke(nameof(ResumeMovement), 0.5f);
    }

    private void ResumeMovement()
    {
        if (!isDead)
            agent.isStopped = false;
    }

    public void ReceiveHit(int damage)
    {
        if (isDead) return;

        float distanceToPlayer = Vector3.Distance(agent.transform.position, target.position);
        if (distanceToPlayer <= attackRange)
        {
            currentHealth -= damage;
            animator.SetTrigger("GotHitTrigger");
            Debug.Log($"Alien got hit! Health: {currentHealth}");

            // Instantiate alien blood effect at alien's position
            if (alienBloodPrefab != null)
            {
                Vector3 spawnPos = transform.position + Vector3.up * 1.0f; // Adjust height as needed
                Instantiate(alienBloodPrefab, spawnPos, Quaternion.identity);
            }

            Stagger();

            if (currentHealth <= 0)
            {
                Die();
            }
        }
        else
        {
            Debug.Log("Player is too far to hit alien.");
        }
    }

    private void Stagger()
    {
        isStaggered = true;
        CancelInvoke(nameof(EndStagger));
        Invoke(nameof(EndStagger), staggerDuration);
    }

    private void EndStagger()
    {
        isStaggered = false;
    }

    public void Die()
    {
        if (isDead) return;

        isDead = true;

        animator.ResetTrigger("HitTrigger");
        animator.SetTrigger("DeathTrigger");
        animator.SetBool("IsDead", true);
        Debug.Log("Alien died.");

        OnDeath?.Invoke();

        // Delay disabling NavMeshAgent and Collider to allow death animation to play
        Invoke(nameof(DisableComponents), disableComponentsDelay);

        // Destroy the alien after destroyDelay seconds
        Destroy(transform.root.gameObject, destroyDelay);

        enabled = false;
    }

    private void DisableComponents()
    {
        if (agent != null)
        {
            agent.isStopped = true;
            agent.enabled = false;
        }

        Collider col = GetComponent<Collider>();
        if (col != null)
            col.enabled = false;
    }
}

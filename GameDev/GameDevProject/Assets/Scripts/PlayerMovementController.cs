using UnityEngine;

public class PlayerMovementController : MonoBehaviour
{
    private static PlayerMovementController instance;

    private Animator eveAnimator;
    private CharacterController characterController;

    [Header("Movement Settings")]
    public float walkSpeed = 2f;
    public float slowRunSpeed = 4f;
    public float rotationSmoothTime = 0.1f;
    public float rotationSpeed = 10f;
    public float moveSmoothTime = 0.1f;

    private Vector3 currentMoveVelocity;
    private Vector3 moveDampVelocity;

    [Header("Ground & Gravity Settings")]
    public float groundedGravity = -0.5f;
    public float gravity = -9.81f;

    private bool isGrounded;
    private float groundedBufferTime = 0.1f;
    private float groundedBufferCounter = 0f;

    private float verticalVelocity = 0f;

    private float currentRotation;
    private float rotationVelocity;

    [Header("Combat Settings")]
    public int punchDamage = 50;
    public int kickDamage = 50;
    public float attackRange = 3f;

    [Header("References")]
    [Tooltip("Assign the HealthManager GameObject here")]
    public HealthManager healthManager;  // Assign this in Inspector or find at runtime

    [Header("Effects")]
    public GameObject playerBloodPrefab; // Assign the player blood particle prefab here

    void Awake()
    {
        if (instance == null)
        {
            instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else if (instance != this)
        {
            Destroy(gameObject);
            return;
        }
    }

    void Start()
    {
        eveAnimator = GetComponent<Animator>();
        characterController = GetComponent<CharacterController>();

        if (healthManager == null)
        {
            // Try to find HealthManager in scene if not assigned
            healthManager = FindObjectOfType<HealthManager>();
            if (healthManager == null)
            {
                Debug.LogError("HealthManager component not assigned or found in scene!");
                enabled = false;
                return;
            }
        }

        healthManager.OnHealthChanged += HandleHealthChanged;
        healthManager.OnDeath += HandleDeath;

        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
    }

    void Update()
    {
        if (healthManager != null && healthManager.GetCurrentHealth() <= 0)
            return;

        HandleGroundedBuffer();

        HandleMovement();

        HandleRotation();

        ApplyGravity();

        MoveCharacter();

        UpdateAnimatorParameters();

        HandleCombatInput();
    }

    private void HandleGroundedBuffer()
    {
        bool currentlyGrounded = characterController.isGrounded;
        if (currentlyGrounded)
            groundedBufferCounter = groundedBufferTime;
        else
            groundedBufferCounter -= Time.deltaTime;

        isGrounded = groundedBufferCounter > 0f;

        if (isGrounded && verticalVelocity < 0)
            verticalVelocity = groundedGravity;
    }

    private void HandleMovement()
    {
        float verticalInput = Mathf.Max(0f, Input.GetAxis("Vertical")); // no backward movement
        float horizontalInput = Input.GetAxis("Horizontal");

        Vector3 camForward = Camera.main.transform.forward;
        camForward.y = 0f;
        camForward.Normalize();

        Vector3 camRight = Camera.main.transform.right;
        camRight.y = 0f;
        camRight.Normalize();

        Vector3 moveDirection = camForward * verticalInput + camRight * horizontalInput;
        moveDirection.Normalize();

        float targetSpeed = Input.GetKey(KeyCode.LeftShift) ? slowRunSpeed : walkSpeed;
        Vector3 targetMove = moveDirection * targetSpeed;

        currentMoveVelocity = Vector3.SmoothDamp(currentMoveVelocity, targetMove, ref moveDampVelocity, moveSmoothTime);
    }

    private void HandleRotation()
    {
        Vector3 moveDirection = currentMoveVelocity.normalized;

        if (moveDirection.magnitude > 0.1f)
        {
            float targetAngle = Mathf.Atan2(moveDirection.x, moveDirection.z) * Mathf.Rad2Deg;
            currentRotation = Mathf.SmoothDampAngle(transform.eulerAngles.y, targetAngle, ref rotationVelocity, rotationSmoothTime);
            transform.rotation = Quaternion.Euler(0f, currentRotation, 0f);
        }
        else
        {
            float mouseX = Input.GetAxis("Mouse X");
            if (Mathf.Abs(mouseX) > 0.01f)
            {
                float targetAngle = transform.eulerAngles.y + mouseX * rotationSpeed;
                currentRotation = Mathf.SmoothDampAngle(transform.eulerAngles.y, targetAngle, ref rotationVelocity, rotationSmoothTime);
                transform.rotation = Quaternion.Euler(0f, currentRotation, 0f);
            }
        }
    }

    private void ApplyGravity()
    {
        verticalVelocity += gravity * Time.deltaTime;
    }

    private void MoveCharacter()
    {
        Vector3 movement = currentMoveVelocity + Vector3.up * verticalVelocity;
        characterController.Move(movement * Time.deltaTime);
    }

    private void UpdateAnimatorParameters()
    {
        float speed = new Vector3(currentMoveVelocity.x, 0, currentMoveVelocity.z).magnitude;
        eveAnimator.SetFloat("Speed", speed);
        eveAnimator.SetBool("IsRunning", Input.GetKey(KeyCode.LeftShift));
    }

    private void HandleCombatInput()
    {
        bool isPunching = Input.GetKey(KeyCode.Space);
        bool isStrongPunch = isPunching && Input.GetKey(KeyCode.LeftShift);
        bool isKicking = Input.GetKey(KeyCode.K);

        eveAnimator.SetBool("IsPunching", isPunching);
        eveAnimator.SetBool("IsStrongPunch", isStrongPunch);
        eveAnimator.SetBool("IsKicking", isKicking);

        if (Input.GetKeyDown(KeyCode.Space))
        {
            TryAttack(punchDamage);
        }
        if (Input.GetKeyDown(KeyCode.K))
        {
            TryAttack(kickDamage);
        }
    }

    private void TryAttack(int damage)
    {
        AlienController[] aliens = FindObjectsOfType<AlienController>();
        foreach (var alien in aliens)
        {
            float dist = Vector3.Distance(transform.position, alien.transform.position);
            if (dist <= attackRange)
            {
                alien.ReceiveHit(damage);
                Debug.Log($"Attacked alien {alien.name} for {damage} damage.");
            }
        }
    }

    public void TakeDamage(int damage)
    {
        if (healthManager != null)
        {
            Debug.Log($"Player takes {damage} damage.");
            healthManager.TakeDamage(damage);
            eveAnimator.SetTrigger("IsHit"); // Trigger hit animation immediately

            // Spawn blood effect at player's position
            if (playerBloodPrefab != null)
            {
                Vector3 spawnPos = transform.position + Vector3.up * 1.0f; // Adjust height if needed
                Instantiate(playerBloodPrefab, spawnPos, Quaternion.identity);
            }
        }
    }

    private void HandleHealthChanged(int currentHealth)
    {
        Debug.Log($"Player health changed: {currentHealth}");
        // Additional reactions to health change can be added here
    }

    private void HandleDeath()
    {
        eveAnimator.SetTrigger("IsDead");
        enabled = false; // Disable player control on death
        Debug.Log("Player died.");
    }

    void OnDestroy()
    {
        if (healthManager != null)
        {
            healthManager.OnHealthChanged -= HandleHealthChanged;
            healthManager.OnDeath -= HandleDeath;
        }
    }
}

#include <SFML/Graphics.hpp>
#include <cmath>
#include <vector>
#include <fstream>
#include <iostream>
#include <algorithm>
#include <string>
#include <ctime>
#include <iomanip>
#include <sstream>
#include <optional>

// State vector for RL agent
struct State {
    float s_front;
    float s_front_left;
    float s_front_right;
    float s_left;
    float s_right;
    float speed;
    float steering;
};

// Helper functions for sensors
sf::Vector2f getCarCenter(const sf::Sprite& car) {
    sf::FloatRect bounds = car.getGlobalBounds();
    return sf::Vector2f(bounds.position.x + bounds.size.x / 2,
                        bounds.position.y + bounds.size.y / 2);
}

float degToRad(float deg) {
    return deg * 3.14159265f / 180.0f;
}

float castRay(sf::Vector2f origin, float angleDeg, const std::vector<sf::RectangleShape>& obstacles, float maxDistance = 300.0f) {
    float angle = degToRad(angleDeg);
    sf::Vector2f dir(std::cos(angle), std::sin(angle));

    float distance = 0.0f;

    while (distance < maxDistance) {
        sf::Vector2f point = origin + dir * distance;

        for (const auto& obs : obstacles) {
            if (obs.getGlobalBounds().contains(point)) {
                return distance;  // hit detected
            }
        }

        distance += 2.0f;  // step resolution
    }

    return maxDistance; // nothing hit
}

// Discretization: Convert normalized sensor distance [0, 1] to bucket
int bucketizeSensor(float d) {
    if (d < 0.12f) return 0; // very close - DANGER
    if (d < 0.30f) return 1; // close
    if (d < 0.60f) return 2; // medium
    return 3;                // far - safe
}

// Discretization: Convert normalized speed [-1, 1] to bucket
int bucketizeSpeed(float s) {
    if (s < -0.2f) return 0; // reversing
    if (s < 0.15f) return 1; // slow/still
    if (s < 0.5f) return 2;  // moderate forward
    return 3;                // fast forward
}

// Discretization: Convert normalized steering [0, 1] to bucket
int bucketizeSteering(float st) {
    if (st < 0.25f) return 0; // left
    if (st < 0.5f) return 1;  // straight-left
    if (st < 0.75f) return 2; // straight-right
    return 3;                 // right
}

// Discretized state for Q-learning (finite state space)
struct DiscreteState {
    int front;    // 0-3
    int left;     // 0-3
    int right;    // 0-3
    int speed;    // 0-3
    int steering; // 0-3
    
    // Convert from continuous RLState
    static DiscreteState fromRLState(float front, float left, float right, float speed, float steering) {
        DiscreteState ds;
        ds.front = bucketizeSensor(front);
        ds.left = bucketizeSensor(left);
        ds.right = bucketizeSensor(right);
        ds.speed = bucketizeSpeed(speed);
        ds.steering = bucketizeSteering(steering);
        return ds;
    }
    
    // Encode to single integer index for Q-table (0 to 4^5 - 1 = 1023)
    int toIndex() const {
        return front * 256 + left * 64 + right * 16 + speed * 4 + steering;
        // front(0-3) * 4^4 + left(0-3) * 4^3 + right(0-3) * 4^2 + speed(0-3) * 4 + steering(0-3)
    }
}; // <- MISSING SEMICOLON

struct Car {
    sf::Sprite body;
    sf::Texture texture;

    float x = 400;
    float y = 300;
    float velocity = 0.0f;
    float angle = 0.0f;
    float steeringInput = 0.0f;      // Current steering input (-1 to 1)
    float steeringAngle = 0.0f;      // Actual steering angle with lag
    float targetVelocity = 0.0f;     // Target velocity for smooth acceleration

    // Enhanced physics constants
    const float acceleration = 0.12f;
    const float deceleration = 0.08f;
    const float maxSpeed = 2.5f;
    const float minSpeed = -1.2f;
    const float baseFriction = 0.94f;         // Velocity decay per frame
    const float steeringLag = 0.82f;          // Steering inertia (lower = more responsive)
    const float baseMaxTurnRate = 3.5f;       // Max turning rate at low speed
    const float speedTurnReduction = 0.4f;    // How much speed reduces turning ability
    
    // Discrete action set for AI
    enum Action {
        DO_NOTHING = 0,
        ACCELERATE = 1,
        BRAKE = 2,
        TURN_LEFT = 3,
        TURN_RIGHT = 4
    };

    Car() : body(texture) {
        if (!texture.loadFromFile("assets/car sprite.png")) {
            (void)texture.resize({40, 20});
        }
        body.setTexture(texture);
        body.setOrigin({texture.getSize().x / 2.0f, texture.getSize().y / 2.0f});
        body.setScale({0.45f, 0.45f});
        body.setPosition({x, y});
        body.setRotation(sf::degrees(180));
    }

    // Apply discrete action (for RL agent) using the Action enum
    void applyAction(Action a) {
        switch(a) {
            case ACCELERATE:
                velocity += acceleration;
                break;
            case BRAKE:
                velocity -= deceleration;
                break;
            case TURN_LEFT:
                steeringInput = -0.9f;  // Full left turn input
                break;
            case TURN_RIGHT:
                steeringInput = 0.9f;   // Full right turn input
                break;
            case DO_NOTHING:
            default:
                steeringInput *= 0.7f;  // Gradually return to straight when no input
                break;
        }
    }

    // Update using an Action value with improved physics
    void update(Action action) {
        applyAction(action);
        
        // Clamp velocity
        if (velocity > maxSpeed) velocity = maxSpeed;
        if (velocity < minSpeed) velocity = minSpeed;
        
        // Apply friction/drag (more realistic - proportional to speed)
        float dynamicFriction = baseFriction + (std::abs(velocity) * 0.01f); // Drag increases with speed
        velocity *= dynamicFriction;
        
        // Stop if moving too slowly
        if (std::abs(velocity) < 0.03f) velocity = 0;
        
        // Update steering angle with lag (realistic steering response)
        steeringAngle += (steeringInput - steeringAngle) * (1.0f - steeringLag);
        
        // Clamp steering angle
        if (steeringAngle > 1.0f) steeringAngle = 1.0f;
        if (steeringAngle < -1.0f) steeringAngle = -1.0f;
        
        // Calculate turn rate: reduced at high speeds (traction limit)
        float speedFactor = 1.0f - (std::abs(velocity) / maxSpeed) * speedTurnReduction;
        speedFactor = std::max(0.3f, speedFactor); // Never reduce below 30%
        float currentMaxTurnRate = baseMaxTurnRate * speedFactor;
        
        // Apply steering to angle
        angle += currentMaxTurnRate * steeringAngle;
        
        // Move car in direction of angle with current velocity
        float radians = angle * 3.14159f / 180.0f;
        x += std::cos(radians) * velocity;
        y += std::sin(radians) * velocity;
        
        // Update sprite position and rotation
        body.setPosition({x, y});
        body.setRotation(sf::degrees(angle + 180));
    }
    
    // Check collision with rectangles
    bool checkCollision(const std::vector<sf::RectangleShape>& rects) {
        sf::FloatRect carBounds = body.getGlobalBounds();
        for (const auto& rect : rects) {
            if (carBounds.findIntersection(rect.getGlobalBounds()).has_value()) {
                return true;
            }
        }
        return false;
    }
    
    // Get sensor readings (normalized 0.0-1.0)
    std::vector<float> getSensorReadings(const std::vector<sf::RectangleShape>& obstacles) {
        sf::Vector2f center = getCarCenter(body);
        
        float dFront = castRay(center, angle, obstacles) / 300.0f;
        float dFrontLeft = castRay(center, angle - 45, obstacles) / 300.0f;
        float dFrontRight = castRay(center, angle + 45, obstacles) / 300.0f;
        float dLeft = castRay(center, angle - 90, obstacles) / 300.0f;
        float dRight = castRay(center, angle + 90, obstacles) / 300.0f;
        
        return {dFront, dFrontLeft, dFrontRight, dLeft, dRight};
    }

    // Get current state for RL agent
    State getState(const std::vector<sf::RectangleShape>& obstacles) {
        std::vector<float> sensors = getSensorReadings(obstacles);
        
        State state;
        state.s_front = sensors[0];
        state.s_front_left = sensors[1];
        state.s_front_right = sensors[2];
        state.s_left = sensors[3];
        state.s_right = sensors[4];
        state.speed = velocity / maxSpeed; // Normalized speed
        state.steering = steeringAngle;    // Current steering angle
        
        return state;
    }
};

// Compute reward based on previous and current state and environment flags
float computeReward(const State& prev, const State& curr, bool collision, bool offroad) {
    float reward = 0.0f;

    // COLLISION: Heavy penalty - worst outcome
    if (collision) {
        return -10.0f; // Strong negative signal
    }

    // OFFROAD: Heavy penalty
    if (offroad) {
        return -8.0f;
    }

    // WALL PROXIMITY: Penalize getting too close to obstacles
    float minFrontDist = std::min({curr.s_front, curr.s_front_left, curr.s_front_right});
    if (minFrontDist < 0.15f) reward -= 2.0f;  // Very close
    else if (minFrontDist < 0.35f) reward -= 0.5f; // Somewhat close

    // FORWARD MOVEMENT: Strongly reward movement
    if (curr.speed > 0.1f) reward += 0.5f;    // Moving forward
    else if (curr.speed > 0.0f) reward += 0.2f; // Slow forward
    else if (curr.speed < -0.05f) reward -= 0.3f; // Going backward (discourage)

    // LANE-KEEPING: Stay centered between obstacles (better centering reward)
    float sideBalance = std::abs(curr.s_left - curr.s_right);
    if (sideBalance < 0.08f) reward += 0.5f;   // Well centered
    else if (sideBalance < 0.15f) reward += 0.25f; // Okay centered
    else if (sideBalance < 0.3f) reward += 0.1f; // Slightly off
    
    // CENTERLINE DISTANCE: Penalize drifting to edges
    float centerDistance = sideBalance;
    if (centerDistance > 0.4f) reward -= 0.2f; // Drifting too far

    // SMOOTH STEERING: Reward gradual turns, penalize jerky movements
    float steerChange = std::abs(curr.steering - prev.steering);
    if (steerChange < 0.005f) reward += 0.15f; // Very smooth
    else if (steerChange < 0.015f) reward += 0.08f; // Smooth
    else if (steerChange > 0.1f) reward -= 0.15f; // Jerky (zig-zag motion)

    // ZIG-ZAG PENALTY: Discourage oscillating steering
    // (penalized in the jerky check above, but can add cumulative penalty)
    if (steerChange > 0.08f) reward -= 0.1f; // Aggressive steering change

    // IDLE PENALTY: Discourage standing still
    if (std::abs(curr.speed) < 0.02f) reward -= 0.2f;

    // TIME PENALTY: Small penalty per step to encourage efficiency
    reward -= 0.02f; // Encourages finding solutions faster

    // SURVIVAL BONUS: Just making it through the step
    reward += 0.08f;

    return reward;
}

// Q-learning table: Q[state][action] → expected cumulative reward
const int STATE_COUNT = 1024;  // 4^5 discretized states (finer granularity)
const int ACTION_COUNT = 5;   // 5 discrete actions
double Q[STATE_COUNT][ACTION_COUNT];

// Q-learning hyperparameters
double alpha = 0.5;          // learning rate [0.3-0.5] - increased for faster learning
double gamma_discount = 0.99; // discount factor [0.99] - slightly higher for long-term rewards
double epsilon = 0.4;        // exploration probability [0.0-1.0] - balanced explore/exploit
int globalEpisodeNumber = 0; // Global episode counter for persistence

// Initialize Q-table to zeros (clean slate for learning)
void initQ() {
    for (int s = 0; s < STATE_COUNT; s++) {
        for (int a = 0; a < ACTION_COUNT; a++) {
            Q[s][a] = 0.0; // Start with zero Q-values
        }
    }
}

// Save Q-table to disk for persistence
void saveQ(const std::string& filename = "q_table.bin") {
    std::ofstream file(filename, std::ios::binary);
    if (!file.is_open()) {
        std::cerr << "Failed to save Q-table to " << filename << std::endl;
        return;
    }
    
    // Save Q-values
    for (int s = 0; s < STATE_COUNT; s++) {
        for (int a = 0; a < ACTION_COUNT; a++) {
            file.write(reinterpret_cast<char*>(&Q[s][a]), sizeof(double));
        }
    }
    
    // Save training metadata
    file.write(reinterpret_cast<char*>(&epsilon), sizeof(double));
    file.write(reinterpret_cast<char*>(&globalEpisodeNumber), sizeof(int));
    
    file.close();
    std::cerr << "Q-table saved successfully (Episode: " << globalEpisodeNumber << ", Epsilon: " << epsilon << ")" << std::endl;
}

// Load Q-table from disk
bool loadQ(const std::string& filename = "q_table.bin") {
    std::ifstream file(filename, std::ios::binary);
    if (!file.is_open()) {
        std::cerr << "Q-table file not found: " << filename << " (starting fresh)" << std::endl;
        return false;
    }
    
    // Load Q-values
    for (int s = 0; s < STATE_COUNT; s++) {
        for (int a = 0; a < ACTION_COUNT; a++) {
            file.read(reinterpret_cast<char*>(&Q[s][a]), sizeof(double));
        }
    }
    
    // Load training metadata
    file.read(reinterpret_cast<char*>(&epsilon), sizeof(double));
    file.read(reinterpret_cast<char*>(&globalEpisodeNumber), sizeof(int));
    
    file.close();
    std::cerr << "Q-table loaded successfully. Resuming from Episode " << globalEpisodeNumber << " (Epsilon: " << epsilon << ")" << std::endl;
    return true;
}

// ε-greedy action selection: explore randomly or exploit best action
int chooseAction(int stateIndex) {
    // Exploration: random action
    if ((double)rand() / RAND_MAX < epsilon) {
        return rand() % ACTION_COUNT;
    }
    
    // Exploitation: greedy (argmax Q[s][a])
    int bestAction = 0;
    double bestValue = Q[stateIndex][0];
    for (int a = 1; a < ACTION_COUNT; a++) {
        if (Q[stateIndex][a] > bestValue) {
            bestValue = Q[stateIndex][a];
            bestAction = a;
        }
    }
    return bestAction;
}

// Q-learning update: Q(s,a) ← Q(s,a) + α[r + γ·max(Q(s',·)) - Q(s,a)]
void updateQ(int stateIdx, int actionIdx, double reward, int nextStateIdx) {
    // Find max Q-value for next state
    double maxNextQ = Q[nextStateIdx][0];
    for (int a = 1; a < ACTION_COUNT; a++) {
        maxNextQ = std::max(maxNextQ, Q[nextStateIdx][a]);
    }
    
    // Bellman update
    double td_error = reward + gamma_discount * maxNextQ - Q[stateIdx][actionIdx];
    Q[stateIdx][actionIdx] += alpha * td_error;
}

// Select best action for a state (greedy: argmax Q[s][a])
int getGreedyAction(int stateIndex) {
    int bestAction = 0;
    double bestValue = Q[stateIndex][0];
    for (int a = 1; a < ACTION_COUNT; a++) {
        if (Q[stateIndex][a] > bestValue) {
            bestValue = Q[stateIndex][a];
            bestAction = a;
        }
    }
    return bestAction;
}

// Reset car to starting position and clear state
struct ResetCarParams {
    float x;
    float y;
};

ResetCarParams resetCar(Car& car) {
    car.x = 400.0f;
    car.y = 300.0f;
    car.velocity = 0.0f;
    car.angle = 0.0f;
    car.body.setPosition({car.x, car.y});
    car.body.setRotation(sf::degrees(car.angle + 180));
    return {car.x, car.y};
}

// Episode statistics
struct Episode {
    int number;
    float cumulativeReward;
    int stepCount;
    bool crashed;
};

// History buffer for episodes to export to dashboard
std::vector<Episode> episodesHistory;

// Save training metrics as JSON for dashboard consumption
void saveTrainingJSON(const std::string& filename, const std::vector<Episode>& episodes, double eps) {
    std::ofstream f(filename);
    if (!f.is_open()) {
        std::cerr << "Failed to write training JSON to " << filename << std::endl;
        return;
    }

    f << "{\n  \"episodes\": [\n";
    int start = std::max(0, (int)episodes.size() - 200);
    for (size_t i = start; i < episodes.size(); ++i) {
        const Episode &e = episodes[i];
        f << "    {";
        f << "\"id\":" << e.number << ",";
        f << "\"reward\":" << std::fixed << std::setprecision(3) << e.cumulativeReward << ",";
        f << "\"epsilon\":" << std::fixed << std::setprecision(3) << eps << ",";
        f << "\"steps\":" << e.stepCount << ",";
        f << "\"crashed\":" << (e.crashed ? "true" : "false");
        f << " }";
        if (i + 1 < episodes.size()) f << ",\n"; else f << "\n";
    }
    f << "  ]\n}";
    f.close();
}

// Export current training state to state.json for dashboard consumption
void saveStateJSON(const std::string& filename, 
                   int episode, int step, float totalReward, float avgReward, 
                   double epsilon, float carX, float carY, float angle, float speed, 
                   float steering, const std::vector<float>& sensors, 
                   int collisions, const std::string& lastAction,
                   unsigned int windowWidth, unsigned int windowHeight) {
    std::string tmpFilename = filename + ".tmp";
    std::ofstream f(tmpFilename);
    if (!f.is_open()) return;

    f << "{\n";
    f << "  \"episode\": " << episode << ",\n";
    f << "  \"step\": " << step << ",\n";
    f << "  \"total_reward\": " << std::fixed << std::setprecision(3) << totalReward << ",\n";
    f << "  \"avg_reward\": " << std::fixed << std::setprecision(3) << avgReward << ",\n";
    f << "  \"epsilon\": " << std::fixed << std::setprecision(4) << epsilon << ",\n";
    f << "  \"position\": {\"x\": " << std::setprecision(2) << carX << ", \"y\": " << carY << "},\n";
    f << "  \"angle\": " << std::setprecision(2) << angle << ",\n";
    f << "  \"speed\": " << std::setprecision(3) << speed << ",\n";
    f << "  \"steering\": " << std::setprecision(3) << steering << ",\n";
    f << "  \"sensors\": {";
    if (sensors.size() >= 5) {
        f << "\"front\": " << std::setprecision(3) << sensors[0] << ", ";
        f << "\"front_left\": " << sensors[1] << ", ";
        f << "\"front_right\": " << sensors[2] << ", ";
        f << "\"left\": " << sensors[3] << ", ";
        f << "\"right\": " << sensors[4];
    }
    f << "},\n";
    f << "  \"collisions\": " << collisions << ",\n";
    f << "  \"last_action\": \"" << lastAction << "\",\n";
    f << "  \"window_width\": " << windowWidth << ",\n";
    f << "  \"window_height\": " << windowHeight << "\n";
    f << "}\n";
    f.close();

    // Atomic replace to prevent reading partial JSON
    std::rename(tmpFilename.c_str(), filename.c_str());
}

int main() {
    // Initialize Q-table
    initQ();
    
    // Try to load saved Q-table (restore previous progress)
    bool loaded = loadQ("q_table.bin");
    if (!loaded) {
        std::cerr << "Starting with fresh Q-table." << std::endl;
    }
    
    // Load background
    sf::Texture backgroundTexture;
    bool backgroundLoaded = true;
    if (!backgroundTexture.loadFromFile("assets/city.jpg")) {
        std::cerr << "Warning: assets/city.jpg not found — continuing without background." << std::endl;
        backgroundLoaded = false;
    }
    sf::Sprite background(backgroundTexture);
    
    // Set window size to match background image
    sf::Vector2u bgSize = backgroundTexture.getSize();
    sf::RenderWindow window(sf::VideoMode(bgSize), "Autonomous Vehicle Simulator");
    window.setFramerateLimit(60);

    // Font for sensor display
    sf::Font font;
    if (!font.openFromFile("/System/Library/Fonts/Supplemental/Arial.ttf")) {
        // Fallback if font not found
    }
    sf::Text sensorText(font);
    sensorText.setCharacterSize(20);
    sensorText.setFillColor(sf::Color::White);
    sensorText.setPosition({10, 10});

    // Drawing variables
    std::vector<sf::RectangleShape> drawnRects;
    bool isDrawing = false;
    sf::Vector2i startPos;
    
    // Control mode
    bool humanMode = false; // H = human, K = AI mode (default: AI on startup)
    
    // Track previous state for AI action selection
    int prevStateIndex = 0;
    
    // Episode training variables
    float episodeCumulativeReward = 0.0f;
    int episodeStepCount = 0;
    
    // Auto-load collision areas on startup
    std::ifstream file("collision_areas.txt");
    float x, y, w, h;
    while (file >> x >> y >> w >> h) {
        sf::RectangleShape rect;
        rect.setPosition({x, y});
        rect.setSize({w, h});
        rect.setFillColor(sf::Color(255, 0, 255, 50)); // Transparent magenta
        drawnRects.push_back(rect);
    }
    file.close();

    Car car;
    State previousState = car.getState(drawnRects);

    // Episode loop (training)
    while (window.isOpen()) {
        // Start new episode in AI mode
        if (!humanMode && episodeStepCount == 0) {
            globalEpisodeNumber++;
            episodeCumulativeReward = 0.0f;
            resetCar(car);
            prevStateIndex = 0;
            previousState = car.getState(drawnRects);
        }

        // Step loop (within episode)
        bool episodeTerminal = false;
        bool collision = false;
        
        while (window.isOpen() && !episodeTerminal) {
            while (const std::optional event = window.pollEvent()) {
                if (event->getIf<sf::Event::Closed>())
                    window.close();
                
                if (const auto* keyPressed = event->getIf<sf::Event::KeyPressed>()) {
                    if (keyPressed->code == sf::Keyboard::Key::Escape)
                        window.close();
                    
                    // Save rectangles with S key
                    if (keyPressed->code == sf::Keyboard::Key::S) {
                        std::ofstream file("collision_areas.txt");
                        for (const auto& rect : drawnRects) {
                            sf::Vector2f pos = rect.getPosition();
                            sf::Vector2f size = rect.getSize();
                            file << pos.x << " " << pos.y << " " << size.x << " " << size.y << std::endl;
                        }
                        file.close();
                    }
                    
                    // Load rectangles with L key
                    if (keyPressed->code == sf::Keyboard::Key::L) {
                        drawnRects.clear();
                        std::ifstream file("collision_areas.txt");
                        float x, y, w, h;
                        while (file >> x >> y >> w >> h) {
                            sf::RectangleShape rect;
                            rect.setPosition({x, y});
                            rect.setSize({w, h});
                            rect.setFillColor(sf::Color(255, 0, 255, 50)); // Transparent magenta
                            drawnRects.push_back(rect);
                        }
                        file.close();
                    }
                    
                    // Mode switching
                    if (keyPressed->code == sf::Keyboard::Key::H) {
                        humanMode = true;
                        episodeStepCount = 0; // Reset episode on mode switch
                    }
                    if (keyPressed->code == sf::Keyboard::Key::K) {
                        humanMode = false;
                        episodeStepCount = 0; // Reset episode on mode switch
                    }
                }
            } // End of event polling loop

            // Get action based on mode (uses Car::Action)
            Car::Action action = Car::DO_NOTHING; // default: do nothing

            if (humanMode) {
                // Human keyboard control (debug mode) -> map keys to actions
                if (sf::Keyboard::isKeyPressed(sf::Keyboard::Key::Up)) action = Car::ACCELERATE;
                if (sf::Keyboard::isKeyPressed(sf::Keyboard::Key::Down)) action = Car::BRAKE;
                if (sf::Keyboard::isKeyPressed(sf::Keyboard::Key::Left)) action = Car::TURN_LEFT;
                if (sf::Keyboard::isKeyPressed(sf::Keyboard::Key::Right)) action = Car::TURN_RIGHT;
            } else {
                // AI mode - ε-greedy action selection from Q-table
                int aiAction = chooseAction(prevStateIndex);
                action = static_cast<Car::Action>(aiAction);
            }
        
        int actionTaken = static_cast<int>(action);

        std::string actionName;
        switch(actionTaken) {
            case 0: actionName = "DO_NOTHING"; break;
            case 1: actionName = "ACCELERATE"; break;
            case 2: actionName = "BRAKE"; break;
            case 3: actionName = "TURN_LEFT"; break;
            case 4: actionName = "TURN_RIGHT"; break;
            default: actionName = "UNKNOWN"; break;
        }

        car.update(action);

        // Get current state for RL agent
        State currentState = car.getState(drawnRects);

        // Convert to compact RL observation struct (front, left, right, speed, steering)
        struct RLState { float front; float left; float right; float speed; float steering; };
        auto toRLState = [](const State &s){ RLState r; r.front = s.s_front; r.left = s.s_left; r.right = s.s_right; r.speed = s.speed; r.steering = s.steering; return r; };
        RLState rlState = toRLState(currentState);

        // Discretize continuous RL state for Q-learning
        DiscreteState discreteState = DiscreteState::fromRLState(rlState.front, rlState.left, rlState.right, rlState.speed, rlState.steering);
        int stateIndex = discreteState.toIndex(); // Q-table index [0, 242]

        // Environment flags
        collision = car.checkCollision(drawnRects);
        bool offroad = (car.x < 0 || car.y < 0 || car.x > (float)bgSize.x || car.y > (float)bgSize.y);

        // Compute reward for this timestep
        float reward = computeReward(previousState, currentState, collision, offroad);
        previousState = currentState; // advance previous state
        
        // Q-learning: update Q-table with transition (s, a, r, s') if in AI mode
        if (!humanMode) {
            updateQ(prevStateIndex, actionTaken, (double)reward, stateIndex);
        }
        
        // Update prevStateIndex for next frame's AI action
        prevStateIndex = stateIndex;

        // Perform per-step state saving for dashboard (throttled)
        if (episodeStepCount % 5 == 0) {
            std::vector<float> sensorVec;
            auto currentSensors = car.getSensorReadings(drawnRects);
            sensorVec.insert(sensorVec.end(), currentSensors.begin(), currentSensors.end());
            
            float currentAvgReward = 0.0f;
            if (!episodesHistory.empty()) {
                int count = std::min(50, (int)episodesHistory.size());
                for (int i = episodesHistory.size() - count; i < (int)episodesHistory.size(); ++i) {
                    currentAvgReward += episodesHistory[i].cumulativeReward;
                }
                currentAvgReward /= count;
            }

            saveStateJSON("state.json", 
                         globalEpisodeNumber, episodeStepCount, 
                         episodeCumulativeReward, currentAvgReward,
                         epsilon, car.x, car.y, car.angle, 
                         car.velocity, car.steeringAngle, sensorVec,
                         0, actionName,
                         bgSize.x, bgSize.y);
        }
        
        // Get sensor readings for display
        std::vector<float> sensors = car.getSensorReadings(drawnRects);
        
        std::string sensorDisplay = "Mode: " + std::string(humanMode ? "HUMAN" : "AI") + "\n";
        sensorDisplay += "Episode: " + std::to_string(globalEpisodeNumber) + " Step: " + std::to_string(episodeStepCount) + "\n";
        sensorDisplay += "Action: " + actionName + " | Velocity: " + std::to_string(car.velocity).substr(0,4) + "\n";
        sensorDisplay += "Cum.Reward: " + std::to_string(episodeCumulativeReward).substr(0,6) + "\n";
        sensorDisplay += "Speed: " + std::to_string(currentState.speed).substr(0,4) + " (bucket:" + std::to_string(discreteState.speed) + ")\n";
        sensorDisplay += "Front: " + std::to_string(currentState.s_front).substr(0,4) + " | Left: " + std::to_string(currentState.s_left).substr(0,4) + " | Right: " + std::to_string(currentState.s_right).substr(0,4) + "\n";
        sensorDisplay += "StateIdx: " + std::to_string(stateIndex) + "/1023 | Q-Value: " + std::to_string(Q[stateIndex][actionTaken]).substr(0,6) + "\n";
        sensorDisplay += "Epsilon: " + std::to_string(epsilon).substr(0,4) + " | Reward: " + std::to_string(reward).substr(0,5) + "\n";
        sensorDisplay += "H=Human K=AI | ESC=Exit";
        sensorText.setString(sensorDisplay);
        
        // Check collision and bounce back if needed
        if (car.checkCollision(drawnRects)) {
            // Bounce back with opposite velocity
            car.x -= std::cos(car.angle * 3.14159 / 180.0) * car.velocity * 2;
            car.y -= std::sin(car.angle * 3.14159 / 180.0) * car.velocity * 2;
            car.velocity = -car.velocity * 0.5f; // Reverse and reduce velocity
            car.body.setPosition({car.x, car.y});
        }

        window.clear(sf::Color::Black);
        if (backgroundLoaded) window.draw(background);
        
        // Draw all rectangles
        for (const auto& rect : drawnRects) {
            window.draw(rect);
        }
        
        window.draw(car.body);
        window.draw(sensorText); // Draw sensor readings
        window.display();
        
        // Accumulate episode reward and steps
        episodeCumulativeReward += reward;
        episodeStepCount++;
        
        // Check terminal state (collision or offroad) in AI mode
        if (!humanMode && (collision || offroad)) {
            episodeTerminal = true;
        }
        
        // Max steps per episode (prevent infinite loops)
        if (episodeStepCount > 500) {  // Reduced from 5000 to 500 for faster episodes
            episodeTerminal = true;
        }
        
        } // End of step loop
        
        // Episode ended: log statistics and reset for next episode
        if (!humanMode && episodeTerminal) {
            // Record episode summary
            Episode ep;
            ep.number = globalEpisodeNumber;
            ep.cumulativeReward = episodeCumulativeReward;
            ep.stepCount = episodeStepCount;
            ep.crashed = collision;
            episodesHistory.push_back(ep);

            // Export to dashboard file (relative path to reinforcement-learning dashboard)
            // DISABLED - using state.json instead which works correctly
            // saveTrainingJSON("../../reinforcement-learning/rl-driving-dashboard/training_live.json", episodesHistory, epsilon);

            // Calculate average reward for last 50 episodes
            float avgReward = 0.0f;
            int count = std::min(50, (int)episodesHistory.size());
            for (int i = episodesHistory.size() - count; i < (int)episodesHistory.size(); ++i) {
                avgReward += episodesHistory[i].cumulativeReward;
            }
            avgReward /= count;

            // Export live state to JSON for dashboard
            std::vector<float> sensorVec;
            auto sensors = car.getSensorReadings(drawnRects);
            sensorVec.insert(sensorVec.end(), sensors.begin(), sensors.end());
            
            std::string actionName = "DONE";
            saveStateJSON("state.json", 
                         globalEpisodeNumber, episodeStepCount, 
                         episodeCumulativeReward, avgReward,
                         epsilon, car.x, car.y, car.angle, 
                         car.velocity, car.steeringAngle, sensorVec,
                         ep.crashed ? 1 : 0, actionName,
                         bgSize.x, bgSize.y);

            // Decay epsilon per episode (much slower than per-frame)
            epsilon *= 0.98; // ~2% decay per episode for gradual transition
            if (epsilon < 0.05) epsilon = 0.05; // minimum exploration 5%

            episodeStepCount = 0; // Reset for next episode start
        }
    
    } // End of episode/window loop

    // Save Q-table progress before exit
    saveQ("q_table.bin");
    
    return 0;
}
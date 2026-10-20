cmake_minimum_required(VERSION 3.16)
project(AutonomousVehicleSimulation)

set(CMAKE_CXX_STANDARD 17)

# Find packages
find_package(PkgConfig REQUIRED)
find_package(SFML 2.5 COMPONENTS graphics window system REQUIRED)

# Add executable
add_executable(${PROJECT_NAME} 
    src/main.cpp
    src/simulation.cpp
    src/vehicle.cpp
    src/environment.cpp
)

# Link libraries
target_link_libraries(${PROJECT_NAME} 
    sfml-graphics 
    sfml-window 
    sfml-system
)

# Include directories
target_include_directories(${PROJECT_NAME} PRIVATE include)
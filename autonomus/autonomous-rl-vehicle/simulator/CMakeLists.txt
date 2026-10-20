cmake_minimum_required(VERSION 3.16)
project(AutonomousVehicleSimulator)

set(CMAKE_CXX_STANDARD 17)

find_package(SFML 3.0 COMPONENTS Graphics Window System REQUIRED)

add_executable(${PROJECT_NAME} main.cpp)

target_link_libraries(${PROJECT_NAME} SFML::Graphics SFML::Window SFML::System)
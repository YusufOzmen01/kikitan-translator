set(TARGET whisperkikitan)
add_executable(${TARGET} main.cpp common.cpp)

add_subdirectory(whisper.cpp whisper_build)
set(GGML_VULKAN ON)

target_compile_features(${TARGET} PRIVATE cxx_std_11)
set_target_properties(${TARGET} PROPERTIES EXPORT_COMPILE_COMMANDS ON RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin")
target_link_libraries(${TARGET} PRIVATE whisper ${FFMPEG_LIBRARIES} ${CMAKE_THREAD_LIBS_INIT})
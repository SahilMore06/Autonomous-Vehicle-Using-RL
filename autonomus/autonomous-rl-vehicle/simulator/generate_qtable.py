import struct

STATE_COUNT = 1024
ACTION_COUNT = 5

filename = 'q_table.bin'

def write_initial_q(filename, epsilon=0.4, episode=0):
    total_doubles = STATE_COUNT * ACTION_COUNT
    with open(filename, 'wb') as f:
        # write zeros for Q-values
        for _ in range(total_doubles):
            f.write(struct.pack('d', 0.0))
        # write epsilon
        f.write(struct.pack('d', float(epsilon)))
        # write episode as 32-bit int
        f.write(struct.pack('i', int(episode)))
    print(f'Wrote {filename} ({total_doubles} doubles + epsilon + episode)')

if __name__ == '__main__':
    write_initial_q(filename)

import numpy as np

import settings


def relax(phi, fixed, sweeps):
    for _ in range(sweeps):
        nxt = phi.copy()
        nxt[1:-1, 1:-1] = 0.25 * (phi[:-2, 1:-1] + phi[2:, 1:-1]
                                  + phi[1:-1, :-2] + phi[1:-1, 2:])
        nxt[:, 0] = nxt[:, 1]
        nxt[:, -1] = nxt[:, -2]
        nxt[fixed] = phi[fixed]
        phi = nxt
    return phi


def field(rows, cols, cluster, sweeps=None):
    sweeps = sweeps if sweeps is not None else settings.T7_SWEEPS
    plate = np.zeros((rows, cols), dtype=bool)
    plate[0, :] = True
    phi = np.tile(np.linspace(0.0, 1.0, rows).reshape(-1, 1), (1, cols))
    fixed = cluster | plate
    fixed[-1, :] = True
    phi[cluster] = 0.0
    phi[plate] = 0.0
    phi[-1, :] = 1.0
    return relax(phi, fixed, sweeps)


def mask_of(rows, cols, order, count):
    m = np.zeros((rows, cols), dtype=bool)
    for r, c in order[:count]:
        m[r, c] = True
    return m


def dbm(rows, cols, eta, seed, sweeps=None, warm=None):
    sweeps = sweeps if sweeps is not None else settings.T7_SWEEPS
    warm = warm if warm is not None else settings.T7_WARM
    rng = np.random.default_rng(seed)
    cluster = np.zeros((rows, cols), dtype=bool)
    cluster[1, cols // 2] = True
    plate = np.zeros((rows, cols), dtype=bool)
    plate[0, :] = True
    phi = np.tile(np.linspace(0.0, 1.0, rows).reshape(-1, 1), (1, cols))
    order = [(1, cols // 2)]
    fixed = cluster | plate
    fixed[-1, :] = True
    phi[cluster] = 0.0
    phi[plate] = 0.0
    phi[-1, :] = 1.0
    phi = relax(phi, fixed, sweeps)
    while not cluster[-2, :].any():
        pad = np.zeros_like(cluster)
        pad[1:, :] |= cluster[:-1, :]
        pad[:-1, :] |= cluster[1:, :]
        pad[:, 1:] |= cluster[:, :-1]
        pad[:, :-1] |= cluster[:, 1:]
        edge = pad & ~cluster & ~plate
        edge[-1, :] = False
        idx = np.argwhere(edge)
        weights = np.maximum(phi[edge], 0.0) ** eta
        total = weights.sum()
        if total <= 0:
            break
        pick = idx[rng.choice(len(idx), p=weights / total)]
        cluster[pick[0], pick[1]] = True
        fixed[pick[0], pick[1]] = True
        phi[pick[0], pick[1]] = 0.0
        order.append((int(pick[0]), int(pick[1])))
        phi = relax(phi, fixed, warm)
    return cluster, np.array(order), phi


def dla(size, count, seed, kill=None, trace_first=0):
    kill = kill if kill is not None else settings.T7_KILL
    rng = np.random.default_rng(seed)
    half = size // 2
    grid = np.zeros((size, size), dtype=bool)
    grid[half, half] = True
    order = [(half, half)]
    tracks = []
    radius = 2
    steps = np.array([(1, 0), (-1, 0), (0, 1), (0, -1)])
    while len(order) < count and radius < half - 2:
        walk = []
        angle = rng.uniform(0, 2 * np.pi)
        r = radius + 2
        y = int(half + r * np.sin(angle))
        x = int(half + r * np.cos(angle))
        for _ in range(settings.T7_WALK_CAP):
            if len(tracks) < trace_first:
                walk.append((y, x))
            dy, dx = steps[rng.integers(4)]
            y += int(dy)
            x += int(dx)
            if (y - half) ** 2 + (x - half) ** 2 > (kill * r) ** 2:
                break
            if y < 1 or y >= size - 1 or x < 1 or x >= size - 1:
                break
            if (grid[y - 1, x] or grid[y + 1, x] or grid[y, x - 1] or grid[y, x + 1]):
                grid[y, x] = True
                order.append((y, x))
                radius = max(radius, int(np.hypot(y - half, x - half)) + 1)
                if len(tracks) < trace_first:
                    walk.append((y, x))
                    tracks.append(np.array(walk))
                break
    if trace_first:
        return grid, np.array(order), tracks
    return grid, np.array(order)


def mass_dim(order, radii):
    pts = np.asarray(order, dtype=float)
    centre = pts[0]
    dist = np.hypot(pts[:, 0] - centre[0], pts[:, 1] - centre[1])
    counts = [int((dist <= r).sum()) for r in radii]
    slope = np.polyfit(np.log(radii), np.log(counts), 1)[0]
    return float(slope), counts


def box_dim(cells, sizes):
    pts = np.asarray(cells, dtype=float)
    pts = pts - pts.min(axis=0)
    counts = [len(np.unique(np.floor(pts / s).astype(np.int64), axis=0)) for s in sizes]
    slope = np.polyfit(np.log(sizes), np.log(counts), 1)[0]
    return float(-slope), counts


def relax_fixed(phi, fixed, sweeps):
    for _ in range(sweeps):
        nxt = phi.copy()
        nxt[1:-1, 1:-1] = 0.25 * (phi[:-2, 1:-1] + phi[2:, 1:-1]
                                  + phi[1:-1, :-2] + phi[1:-1, 2:])
        nxt[fixed] = phi[fixed]
        phi = nxt
    return phi


def square_field(size, side, sweeps):
    half = size // 2
    arm = side // 2
    mask = np.zeros((size, size), dtype=bool)
    mask[half - arm:half + arm + 1, half - arm:half + arm + 1] = True
    phi = np.ones((size, size))
    phi[mask] = 0.0
    fixed = mask.copy()
    fixed[0, :] = True
    fixed[-1, :] = True
    fixed[:, 0] = True
    fixed[:, -1] = True
    phi = relax_fixed(phi, fixed, sweeps)
    corner = (half - arm - 1, half - arm - 1)
    face = (half - arm - 1, half)
    return mask, phi, corner, face

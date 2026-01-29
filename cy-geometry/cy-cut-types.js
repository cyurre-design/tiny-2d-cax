// epsilon is used for fuzzy float comparisons.
// Explanation on result cases LineLineIntr
// NoIntersect

// Either of the following cases:
// Lines are (or almost, using epsilon to determine) parallel
// Both line segments are points and distinct from each other
// One line segment is a point and distinct from the other line segment

// TrueIntersect
// Either of the following cases:
// Line segments are not parallel and intersect at one point
// Both line segments are points and lie over each other (using epsilon for position compare)
// One line segment is a point and lies in other line segment (again using epsilon)

// FalseIntersect
// Either of the following cases:
// Line segments are not parallel and at least one must be extended to intersect (that is for 0 <= t <= 1 for both segments there is no intersect)

// Overlapping
// Either of the following cases:
// The lines are collinear and overlap, the segments may fully, partially or not overlap at all (determined by parametric t values returned)

export const Cut = Object.freeze({
    NoIntersect: 0,
    FalseIntersect: 1,
    TrueIntersect: 2,
    OneIntersect: 3,
    TwoIntersects: 4,
    Overlapping: 5,
    OverlappingLines: 6,
    OverlappingArcs: 7,
    TangentIntersect: 8,
});

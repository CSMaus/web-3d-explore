/**
 * the personal chapter of the About page: the dog, the places, the hobbies. it is empty until the
 * owner gives the photos and the facts; while every list is empty the chapter is not shown.
 *
 * photos go in public/about/ and are named here by file name. before a photo goes in, its location
 * data (GPS) is stripped; no place here is the owner's home or current city unless she says so.
 *
 * - dog: the photos, the first one with the clearest outline (one animal on a plain ground draws
 *   best); its outline is drawn by circles, then the photo fades in under the line.
 * - places: in the order visited; lat and lon in degrees (north and east positive). the route is
 *   drawn place to place over a globe, with the counts of countries and cities and the kilometres.
 * - hobbies: a name and one line each, with a photo if there is one.
 */
export type LifePhoto = { file: string; alt: string };
export type LifePlace = { city: string; country: string; year: number; lat: number; lon: number; photo?: LifePhoto };
export type LifeHobby = { name: string; line: string; photo?: LifePhoto };

export const DOG: { name?: string; line?: string; photos: LifePhoto[] } = { photos: [] };
export const PLACES: LifePlace[] = [];
export const HOBBIES: LifeHobby[] = [];

export const HAS_LIFE = DOG.photos.length > 0 || PLACES.length > 0 || HOBBIES.length > 0;

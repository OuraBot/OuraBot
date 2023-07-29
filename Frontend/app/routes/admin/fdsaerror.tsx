import { LoaderFunction } from '@remix-run/node';

export const loader: LoaderFunction = async ({ params, request }) => {
	throw new Error('Fdsaerror testing');
};

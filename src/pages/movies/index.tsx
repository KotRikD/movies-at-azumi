import { Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { GetServerSideProps } from 'next';
import path from 'path';

import { config } from '@/core/config';
import { walk } from '@/shared/lib/walk';
import { MovieGetLink } from './ui/MovieGetLink';
import { MovieTruncate } from './ui/MovieTruncate';

interface IMoviePath extends path.ParsedPath {
    originalLink: string;
}

interface IMoviesProps {
    movies: IMoviePath[];
}

const Movies: React.FC<IMoviesProps> = ({ movies }) => {
    return (
        <Table>
            <Thead>
                <Tr>
                    <Th>Filename</Th>
                    <Th>Actions</Th>
                </Tr>
            </Thead>
            <Tbody>
                {movies.map((movie) => (
                    <Tr>
                        <Td>{movie.base}</Td>
                        <Td>
                            <MovieGetLink movieLink={movie.originalLink} />
                            <MovieTruncate movieLink={movie.originalLink} />
                        </Td>
                    </Tr>
                ))}
            </Tbody>
        </Table>
    );
};

export const getServerSideProps: GetServerSideProps = async (req) => {
    const movies = [];
    for await (const file of walk(config.moviesPath)) {
        if (file.endsWith('.mkv') || file.endsWith('.mp4')) {
            // @ts-ignore
            movies.push({
                ...path.parse(file),
                originalLink: file as never
            });
        }
    }

    return {
        props: {
            movies
        }
    };
};

export default Movies;

import { GetServerSideProps } from 'next';

export default function Page() {
    return (
        <></>
    );
}

export const getServerSideProps: GetServerSideProps = async () => ({
    props: {},
    redirect: {
        destination: '/movies',
    }
})

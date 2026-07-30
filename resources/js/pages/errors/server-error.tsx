import { HttpErrorPage } from '@/components/errors/http-error-page';

type Props = {
    status?: 500 | 503;
    message?: string | null;
    attempted_path?: string | null;
    is_authenticated?: boolean;
};

export default function ServerError({
    status = 500,
    message = null,
    attempted_path = null,
    is_authenticated = false,
}: Props) {
    return (
        <HttpErrorPage
            status={status === 503 ? 503 : 500}
            message={message}
            attempted_path={attempted_path}
            is_authenticated={is_authenticated}
        />
    );
}

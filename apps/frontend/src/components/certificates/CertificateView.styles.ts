import styled from "styled-components";

export const ViewWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: min(1280px, calc(100vw - 80px));
    margin: 0 auto;
    box-sizing: border-box;
`;

export const CertificateContainer = styled.div`
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;

    @media (max-width: 768px) {
        padding: 8px;
        border-radius: 8px;
    }
`;

export const StatusBanner = styled.div<{ $revoked?: boolean }>`
    background: ${({ $revoked }) => ($revoked ? "#fef2f2" : "#f0fdf4")};
    border: 1px solid ${({ $revoked }) => ($revoked ? "#fecaca" : "#bbf7d0")};
    border-radius: 8px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    color: ${({ $revoked }) => ($revoked ? "#991b1b" : "#166534")};
`;

export const StatusIcon = styled.div<{ $revoked?: boolean }>`
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: ${({ $revoked }) => ($revoked ? "#dc2626" : "#22c55e")};
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
`;

export const StatusText = styled.div`
    flex: 1;
`;

export const StatusTitle = styled.div`
    font-weight: 600;
    font-size: 0.875rem;
`;

export const StatusSubtitle = styled.div`
    font-size: 0.75rem;
    opacity: 0.8;
`;

export const ActionsContainer = styled.div`
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
`;

export const VerificationInfo = styled.div`
    background: #f9fafb;
    border-radius: 8px;
    padding: 16px;
    font-size: 0.875rem;
    color: #6b7280;
    text-align: center;
`;

export const CertificateId = styled.div`
    font-family: monospace;
    font-size: 0.75rem;
    color: #9ca3af;
    margin-top: 8px;
`;

export const ModalSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const ModalSectionTitle = styled.div`
    font-weight: 600;
    font-size: 0.875rem;
    color: #374151;
    margin-top: 4px;
`;

export const InstructionText = styled.div`
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.4;
`;

export const LinkContainer = styled.div`
    display: flex;
    gap: 8px;
    background: #f3f4f6;
    padding: 4px 4px 4px 12px;
    border-radius: 8px;
    align-items: center;
    border: 1px solid #e5e7eb;
`;

export const LinkText = styled.div`
    flex: 1;
    font-family: monospace;
    font-size: 0.75rem;
    color: #374151;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

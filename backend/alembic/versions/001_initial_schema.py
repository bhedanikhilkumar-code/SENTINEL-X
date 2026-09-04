"""Initial schema for SENTINEL-X (PRD Sections 3 & 5)

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-04 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('username', sa.String(120), unique=True, nullable=False),
        sa.Column('role', sa.Enum('analyst', 'senior_analyst', 'soc_lead', 'auditor', name='user_role'), nullable=False, server_default='analyst'),
        sa.Column('display_name', sa.String(255), nullable=False, server_default=''),
        sa.Column('hashed_password', sa.String(255), nullable=False, server_default=''),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 2. cases table
    op.create_table(
        'cases',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('description', sa.Text(), nullable=False, server_default=''),
        sa.Column('status', sa.String(32), nullable=False, server_default='open'),
        sa.Column('created_by', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('seed_document_id', sa.String(36), nullable=True),
        sa.Column('confidence_trend', sa.JSON(), nullable=False, server_default='[]'),
    )

    # 3. documents table
    op.create_table(
        'documents',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('case_id', sa.String(36), sa.ForeignKey('cases.id'), nullable=True),
        sa.Column('source_url', sa.Text(), nullable=False, server_default=''),
        sa.Column('source_type', sa.String(64), nullable=False, server_default='forum_post'),
        sa.Column('author_handle', sa.String(255), nullable=False, server_default='anonymous'),
        sa.Column('platform', sa.String(32), nullable=False, server_default='darkweb'),
        sa.Column('posted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('collected_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('raw_text', sa.Text(), nullable=False),
        sa.Column('sha256', sa.String(64), nullable=False, index=True),
        sa.Column('partial_capture', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('dedup_count', sa.Integer(), nullable=False, server_default='1'),
    )

    # 4. artifacts table
    op.create_table(
        'artifacts',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('source_doc_id', sa.String(36), sa.ForeignKey('documents.id'), nullable=False, index=True),
        sa.Column('artifact_type', sa.String(64), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('extracted_fields', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('extraction_confidence', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('extracted_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 5. stylo_profiles table
    op.create_table(
        'stylo_profiles',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('label', sa.String(255), nullable=False, index=True),
        sa.Column('platform', sa.String(32), nullable=False, server_default='darkweb'),
        sa.Column('features', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('vector', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('sample_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('low_sample_confidence', sa.Boolean(), nullable=False, server_default=sa.text('false')),
    )

    # 6. hypotheses table
    op.create_table(
        'hypotheses',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('case_id', sa.String(36), sa.ForeignKey('cases.id'), nullable=False, index=True),
        sa.Column('claim', sa.Text(), nullable=False),
        sa.Column('status', sa.String(32), nullable=False, server_default='unconfirmed'),
        sa.Column('c_total', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('breakdown', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('created_by', sa.String(255), nullable=False, server_default=''),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 7. graph_annotations table
    op.create_table(
        'graph_annotations',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('node_id', sa.String(255), nullable=False, index=True),
        sa.Column('note', sa.Text(), nullable=False),
        sa.Column('author', sa.String(255), nullable=False, server_default='analyst_demo'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 8. audit_log table
    op.create_table(
        'audit_log',
        sa.Column('seq', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('entry_id', sa.String(36), nullable=False),
        sa.Column('actor', sa.String(255), nullable=False),
        sa.Column('action', sa.String(255), nullable=False),
        sa.Column('entity_ids', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('detail', sa.Text(), nullable=False, server_default=''),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('prev_hash', sa.String(64), nullable=False),
        sa.Column('entry_hash', sa.String(64), nullable=False, index=True),
    )

    # 9. tor_circuits table
    op.create_table(
        'tor_circuits',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('entry_node', sa.String(255), nullable=False, server_default=''),
        sa.Column('exit_node', sa.String(255), nullable=False, server_default=''),
        sa.Column('circuit_id', sa.String(64), nullable=False, server_default=''),
        sa.Column('latency_ms', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('status', sa.String(32), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 10. wallet_clusters table
    op.create_table(
        'wallet_clusters',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('addresses', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('cluster_type', sa.String(64), nullable=False, server_default='btc_co_spend'),
        sa.Column('exchange_flag', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('confidence', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('case_id', sa.String(36), sa.ForeignKey('cases.id'), nullable=True, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 11. wallet_tags table
    op.create_table(
        'wallet_tags',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('address', sa.String(128), nullable=False, index=True),
        sa.Column('tag', sa.String(64), nullable=False),
        sa.Column('category', sa.String(64), nullable=False, server_default='custom'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('author', sa.String(64), nullable=False, server_default='analyst_demo'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('wallet_tags')
    op.drop_table('wallet_clusters')
    op.drop_table('tor_circuits')
    op.drop_table('audit_log')
    op.drop_table('graph_annotations')
    op.drop_table('hypotheses')
    op.drop_table('stylo_profiles')
    op.drop_table('artifacts')
    op.drop_table('documents')
    op.drop_table('cases')
    op.drop_table('users')
    op.execute('DROP TYPE IF EXISTS user_role')

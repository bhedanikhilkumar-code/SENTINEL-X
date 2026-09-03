"""Initial schema for SENTINEL-X

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-04 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('role', sa.Enum('analyst', 'senior_analyst', 'soc_lead', 'auditor', name='user_role_enum', native_enum=False), nullable=False),
        sa.Column('display_name', sa.String(), nullable=False, server_default=''),
        sa.Column('hashed_password', sa.String(), nullable=False, server_default=''),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username')
    )

    # 2. cases table
    op.create_table(
        'cases',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False, server_default=''),
        sa.Column('status', sa.String(), nullable=False, server_default='open'),
        sa.Column('created_by', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('seed_document_id', sa.String(), nullable=True),
        sa.Column('confidence_trend', sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # 3. documents table
    op.create_table(
        'documents',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('case_id', sa.String(), nullable=True),
        sa.Column('source_url', sa.String(), nullable=False, server_default=''),
        sa.Column('source_type', sa.String(), nullable=False, server_default='forum_post'),
        sa.Column('author_handle', sa.String(), nullable=False, server_default='anonymous'),
        sa.Column('platform', sa.String(), nullable=False, server_default='darkweb'),
        sa.Column('posted_at', sa.DateTime(), nullable=True),
        sa.Column('collected_at', sa.DateTime(), nullable=False),
        sa.Column('raw_text', sa.Text(), nullable=False),
        sa.Column('sha256', sa.String(), nullable=False),
        sa.Column('partial_capture', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('dedup_count', sa.Integer(), nullable=False, server_default='1'),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_documents_sha256'), 'documents', ['sha256'], unique=False)

    # 4. artifacts table
    op.create_table(
        'artifacts',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('source_doc_id', sa.String(), nullable=False),
        sa.Column('artifact_type', sa.String(), nullable=False),
        sa.Column('value', sa.String(), nullable=False),
        sa.Column('extracted_fields', sa.JSON(), nullable=False),
        sa.Column('extraction_confidence', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('extracted_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['source_doc_id'], ['documents.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_artifacts_source_doc_id'), 'artifacts', ['source_doc_id'], unique=False)

    # 5. stylo_profiles table
    op.create_table(
        'stylo_profiles',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('label', sa.String(), nullable=False),
        sa.Column('platform', sa.String(), nullable=False, server_default='darkweb'),
        sa.Column('features', sa.JSON(), nullable=False),
        sa.Column('vector', sa.JSON(), nullable=False),
        sa.Column('sample_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('low_sample_confidence', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_stylo_profiles_label'), 'stylo_profiles', ['label'], unique=False)

    # 6. hypotheses table
    op.create_table(
        'hypotheses',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('case_id', sa.String(), nullable=False),
        sa.Column('claim', sa.Text(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='unconfirmed'),
        sa.Column('c_total', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('breakdown', sa.JSON(), nullable=False),
        sa.Column('created_by', sa.String(), nullable=False, server_default=''),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_hypotheses_case_id'), 'hypotheses', ['case_id'], unique=False)

    # 7. graph_annotations table
    op.create_table(
        'graph_annotations',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('node_id', sa.String(), nullable=False),
        sa.Column('note', sa.Text(), nullable=False),
        sa.Column('author', sa.String(), nullable=False, server_default='analyst_demo'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_graph_annotations_node_id'), 'graph_annotations', ['node_id'], unique=False)

    # 8. audit_log table
    op.create_table(
        'audit_log',
        sa.Column('seq', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('entry_id', sa.String(), nullable=False),
        sa.Column('actor', sa.String(), nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('entity_ids', sa.JSON(), nullable=False),
        sa.Column('detail', sa.Text(), nullable=False, server_default=''),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('prev_hash', sa.String(), nullable=False),
        sa.Column('entry_hash', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('seq')
    )
    op.create_index(op.f('ix_audit_log_entry_hash'), 'audit_log', ['entry_hash'], unique=False)

    # 9. tor_circuits table
    op.create_table(
        'tor_circuits',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('entry_node', sa.String(), nullable=False, server_default=''),
        sa.Column('exit_node', sa.String(), nullable=False, server_default=''),
        sa.Column('circuit_id', sa.String(), nullable=False),
        sa.Column('latency_ms', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('status', sa.String(), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tor_circuits_circuit_id'), 'tor_circuits', ['circuit_id'], unique=False)

    # 10. wallet_clusters table
    op.create_table(
        'wallet_clusters',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('addresses', sa.JSON(), nullable=False),
        sa.Column('cluster_type', sa.String(), nullable=False, server_default='mixer_output'),
        sa.Column('exchange_flag', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('confidence', sa.Float(), nullable=False, server_default='0.85'),
        sa.Column('case_id', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_wallet_clusters_case_id'), 'wallet_clusters', ['case_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_wallet_clusters_case_id'), table_name='wallet_clusters')
    op.drop_table('wallet_clusters')
    op.drop_index(op.f('ix_tor_circuits_circuit_id'), table_name='tor_circuits')
    op.drop_table('tor_circuits')
    op.drop_index(op.f('ix_audit_log_entry_hash'), table_name='audit_log')
    op.drop_table('audit_log')
    op.drop_index(op.f('ix_graph_annotations_node_id'), table_name='graph_annotations')
    op.drop_table('graph_annotations')
    op.drop_index(op.f('ix_hypotheses_case_id'), table_name='hypotheses')
    op.drop_table('hypotheses')
    op.drop_index(op.f('ix_stylo_profiles_label'), table_name='stylo_profiles')
    op.drop_table('stylo_profiles')
    op.drop_index(op.f('ix_artifacts_source_doc_id'), table_name='artifacts')
    op.drop_table('artifacts')
    op.drop_index(op.f('ix_documents_sha256'), table_name='documents')
    op.drop_table('documents')
    op.drop_table('cases')
    op.drop_table('users')

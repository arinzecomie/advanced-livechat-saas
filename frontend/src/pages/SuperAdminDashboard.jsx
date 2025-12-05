import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form, Alert, Tab, Tabs, Pagination } from 'react-bootstrap';
import { FaUser, FaBan, FaUnlock, FaSignInAlt, FaKey, FaEdit, FaGlobe, FaLock, FaCheck, FaExclamationTriangle, FaTrash, FaChartLine, FaBullhorn, FaBell, FaTools, FaDatabase, FaFlag } from 'react-icons/fa';
import { toast } from 'react-toastify';
import * as superAdminAPI from '../api/superAdmin';

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [revenueMetrics, setRevenueMetrics] = useState(null);
  const [storageUsage, setStorageUsage] = useState(null);
  const [reportedChats, setReportedChats] = useState([]);
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  
  // Form states
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load initial data
  useEffect(() => {
    loadUsers();
    loadRevenueMetrics();
    loadStorageUsage();
  }, []);

  const loadUsers = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const data = await superAdminAPI.getAllUsers({ page, limit: 10, search });
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (error) {
      toast.error('Failed to load users: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const loadSites = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const data = await superAdminAPI.getAllSites({ page, limit: 10, search });
      setSites(data.sites);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (error) {
      toast.error('Failed to load sites: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptions = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const data = await superAdminAPI.getSubscriptionStatus({ page, limit: 10, search });
      setSubscriptions(data.subscriptions);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (error) {
      toast.error('Failed to load subscriptions: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const loadRevenueMetrics = async () => {
    try {
      const data = await superAdminAPI.getRevenueMetrics({ period: '30d' });
      setRevenueMetrics(data);
    } catch (error) {
      toast.error('Failed to load revenue metrics: ' + error);
    }
  };

  const loadStorageUsage = async () => {
    try {
      const data = await superAdminAPI.getGlobalStorageUsage();
      setStorageUsage(data);
    } catch (error) {
      toast.error('Failed to load storage usage: ' + error);
    }
  };

  const loadReportedChats = async (page = 1) => {
    try {
      setLoading(true);
      const data = await superAdminAPI.getReportedChats({ page, limit: 10 });
      setReportedChats(data.reports);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (error) {
      toast.error('Failed to load reported chats: ' + error);
    } finally {
      setLoading(false);
    }
  };

  // User management handlers
  const handleBanUser = async (userId, reason, duration = null) => {
    try {
      await superAdminAPI.banUser(userId, reason, duration);
      toast.success('User banned successfully');
      loadUsers(currentPage, searchTerm);
    } catch (error) {
      toast.error('Failed to ban user: ' + error);
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      await superAdminAPI.unbanUser(userId);
      toast.success('User unbanned successfully');
      loadUsers(currentPage, searchTerm);
    } catch (error) {
      toast.error('Failed to unban user: ' + error);
    }
  };

  const handleImpersonateUser = async (userId) => {
    try {
      const result = await superAdminAPI.impersonateUser(userId);
      toast.success('Impersonation started successfully');
      // Store impersonation token and redirect to user dashboard
      localStorage.setItem('impersonationToken', result.token);
      window.open('/dashboard', '_blank');
    } catch (error) {
      toast.error('Failed to impersonate user: ' + error);
    }
  };

  const handleResetPassword = async (userId, temporaryPassword = null) => {
    try {
      const result = await superAdminAPI.resetUserPassword(userId, temporaryPassword);
      toast.success('Password reset successfully');
      // Show temporary password to admin
      alert(`Temporary password: ${result.temporaryPassword}`);
    } catch (error) {
      toast.error('Failed to reset password: ' + error);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      await superAdminAPI.updateUserDetails(userId, updates);
      toast.success('User updated successfully');
      loadUsers(currentPage, searchTerm);
    } catch (error) {
      toast.error('Failed to update user: ' + error);
    }
  };

  // Site management handlers
  const handleBlockDomain = async (siteId, reason, duration = null) => {
    try {
      await superAdminAPI.blockDomain(siteId, reason, duration);
      toast.success('Domain blocked successfully');
      loadSites(currentPage, searchTerm);
    } catch (error) {
      toast.error('Failed to block domain: ' + error);
    }
  };

  const handleUnblockDomain = async (siteId) => {
    try {
      await superAdminAPI.unblockDomain(siteId);
      toast.success('Domain unblocked successfully');
      loadSites(currentPage, searchTerm);
    } catch (error) {
      toast.error('Failed to unblock domain: ' + error);
    }
  };

  const handleVerifyDomain = async (siteId) => {
    try {
      await superAdminAPI.verifyDomain(siteId);
      toast.success('Domain verified successfully');
      loadSites(currentPage, searchTerm);
    } catch (error) {
      toast.error('Failed to verify domain: ' + error);
    }
  };

  // Subscription management handlers
  const handleGrantLifetimeAccess = async (userId) => {
    try {
      await superAdminAPI.grantLifetimeAccess(userId);
      toast.success('Lifetime access granted successfully');
      loadUsers(currentPage, searchTerm);
    } catch (error) {
      toast.error('Failed to grant lifetime access: ' + error);
    }
  };

  const handleExtendTrial = async (userId, days) => {
    try {
      await superAdminAPI.extendFreeTrial(userId, days);
      toast.success(`Trial extended by ${days} days successfully`);
      loadUsers(currentPage, searchTerm);
    } catch (error) {
      toast.error('Failed to extend trial: ' + error);
    }
  };

  const handleForceDowngrade = async (userId, reason) => {
    try {
      await superAdminAPI.forceDowngrade(userId, reason);
      toast.success('User downgraded successfully');
      loadUsers(currentPage, searchTerm);
    } catch (error) {
      toast.error('Failed to downgrade user: ' + error);
    }
  };

  // System & Communication handlers
  const handleCreateAnnouncement = async (announcementData) => {
    try {
      await superAdminAPI.createGlobalAnnouncement(announcementData);
      toast.success('Global announcement created successfully');
      setShowAnnouncementModal(false);
    } catch (error) {
      toast.error('Failed to create announcement: ' + error);
    }
  };

  const handleSendNotification = async (notificationData) => {
    try {
      await superAdminAPI.sendPushNotification(notificationData);
      toast.success('Push notification sent successfully');
      setShowNotificationModal(false);
    } catch (error) {
      toast.error('Failed to send notification: ' + error);
    }
  };

  const handleToggleMaintenance = async (maintenanceData) => {
    try {
      await superAdminAPI.toggleMaintenanceMode(maintenanceData);
      toast.success(`Maintenance mode ${maintenanceData.enabled ? 'enabled' : 'disabled'} successfully`);
      setShowMaintenanceModal(false);
    } catch (error) {
      toast.error('Failed to toggle maintenance mode: ' + error);
    }
  };

  // Content & Compliance handlers
  const handlePurgeData = async (purgeData) => {
    try {
      const result = await superAdminAPI.purgeOldData(purgeData);
      if (purgeData.dry_run) {
        toast.info(`Dry run: Would delete ${result.would_delete} records`);
      } else {
        toast.success(`Purged ${result.deleted_count} records successfully`);
      }
      setShowPurgeModal(false);
    } catch (error) {
      toast.error('Failed to purge data: ' + error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchTerm('');
    
    switch (tab) {
      case 'users':
        loadUsers();
        break;
      case 'sites':
        loadSites();
        break;
      case 'subscriptions':
        loadSubscriptions();
        break;
      case 'reported':
        loadReportedChats();
        break;
      default:
        break;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      banned: 'danger',
      pending: 'warning',
      trial: 'info',
      completed: 'success',
      canceled: 'danger',
      blocked: 'danger',
      verified: 'success'
    };
    
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getPlanBadge = (plan) => {
    const variants = {
      free: 'secondary',
      pro: 'primary',
      enterprise: 'warning',
      lifetime: 'success'
    };
    
    return <Badge bg={variants[plan] || 'secondary'}>{plan}</Badge>;
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h1><FaUser /> Super Admin Dashboard</h1>
          <p className="text-muted">Complete platform management and control center</p>
        </Col>
      </Row>

      {/* Quick Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaUser size={24} className="mb-2 text-primary" />
              <h4>{users.length}</h4>
              <p className="text-muted mb-0">Total Users</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaGlobe size={24} className="mb-2 text-success" />
              <h4>{sites.length}</h4>
              <p className="text-muted mb-0">Active Sites</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaChartLine size={24} className="mb-2 text-warning" />
              <h4>${revenueMetrics?.mrr || 0}</h4>
              <p className="text-muted mb-0">Monthly Recurring Revenue</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaDatabase size={24} className="mb-2 text-info" />
              <h4>{storageUsage?.total_usage || '0 GB'}</h4>
              <p className="text-muted mb-0">Storage Usage</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Tabs */}
      <Tabs activeKey={activeTab} onSelect={handleTabChange} className="mb-4">
        <Tab eventKey="users" title={<span><FaUser className="me-2" />Users & Tenants</span>}>
          {/* Users Table */}
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">User Management</h5>
              <div>
                <Form.Control
                  type="search"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    loadUsers(1, e.target.value);
                  }}
                  className="d-inline-block w-auto me-2"
                />
                <Button variant="primary" size="sm">
                  Export Users
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <Table responsive striped hover>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Sites</th>
                    <th>Last Activity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3" style={{width: 40, height: 40}}>
                            <FaUser />
                          </div>
                          <div>
                            <div className="fw-bold">{user.name}</div>
                            <small className="text-muted">ID: {user.id}</small>
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{getPlanBadge(user.plan)}</td>
                      <td>{getStatusBadge(user.status)}</td>
                      <td>{user.sites_count || 0}</td>
                      <td>{new Date(user.last_activity).toLocaleDateString()}</td>
                      <td>
                        <div className="btn-group" role="group">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleImpersonateUser(user.id)}
                            title="Impersonate User"
                          >
                            <FaSignInAlt />
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                            title="Edit User"
                          >
                            <FaEdit />
                          </Button>
                          {user.status === 'banned' ? (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleUnbanUser(user.id)}
                              title="Unban User"
                            >
                              <FaUnlock />
                            </Button>
                          ) : (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => {
                                const reason = prompt('Enter ban reason:');
                                if (reason) handleBanUser(user.id, reason);
                              }}
                              title="Ban User"
                            >
                              <FaBan />
                            </Button>
                          )}
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => {
                              if (confirm('Reset password for this user?')) {
                                handleResetPassword(user.id);
                              }
                            }}
                            title="Reset Password"
                          >
                            <FaKey />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              {totalPages > 1 && (
                <Pagination className="justify-content-center">
                  <Pagination.Prev 
                    onClick={() => loadUsers(Math.max(1, currentPage - 1), searchTerm)}
                    disabled={currentPage === 1}
                  />
                  <Pagination.Item active>{currentPage}</Pagination.Item>
                  <Pagination.Next 
                    onClick={() => loadUsers(Math.min(totalPages, currentPage + 1), searchTerm)}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="sites" title={<span><FaGlobe className="me-2" />Sites & Domains</span>}>
          {/* Sites Table */}
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Site & Domain Control</h5>
              <div>
                <Form.Control
                  type="search"
                  placeholder="Search sites..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    loadSites(1, e.target.value);
                  }}
                  className="d-inline-block w-auto me-2"
                />
                <Button variant="primary" size="sm">
                  Export Sites
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <Table responsive striped hover>
                <thead>
                  <tr>
                    <th>Domain</th>
                    <th>Site ID</th>
                    <th>Owner</th>
                    <th>Status</th>
                    <th>Verified</th>
                    <th>Messages</th>
                    <th>Last Activity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map((site) => (
                    <tr key={site.id}>
                      <td>
                        <div>
                          <div className="fw-bold">{site.domain}</div>
                          <small className="text-muted">{site.site_id}</small>
                        </div>
                      </td>
                      <td>{site.site_id}</td>
                      <td>{site.user_id?.name || 'Unknown'}</td>
                      <td>{getStatusBadge(site.status)}</td>
                      <td>{getStatusBadge(site.domain_verified ? 'verified' : 'pending')}</td>
                      <td>{site.messages_count || 0}</td>
                      <td>{new Date(site.last_activity).toLocaleDateString()}</td>
                      <td>
                        <div className="btn-group" role="group">
                          {!site.domain_verified && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleVerifyDomain(site.id)}
                              title="Verify Domain"
                            >
                              <FaCheck />
                            </Button>
                          )}
                          {site.status === 'blocked' ? (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleUnblockDomain(site.id)}
                              title="Unblock Domain"
                            >
                              <FaUnlock />
                            </Button>
                          ) : (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => {
                                const reason = prompt('Enter block reason:');
                                if (reason) handleBlockDomain(site.id, reason);
                              }}
                              title="Block Domain"
                            >
                              <FaLock />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              {totalPages > 1 && (
                <Pagination className="justify-content-center">
                  <Pagination.Prev 
                    onClick={() => loadSites(Math.max(1, currentPage - 1), searchTerm)}
                    disabled={currentPage === 1}
                  />
                  <Pagination.Item active>{currentPage}</Pagination.Item>
                  <Pagination.Next 
                    onClick={() => loadSites(Math.min(totalPages, currentPage + 1), searchTerm)}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="subscriptions" title={<span><FaChartLine className="me-2" />Subscriptions & Revenue</span>}>
          {/* Subscriptions and Revenue Management */}
          <Row>
            <Col md={8}>
              <Card className="mb-3">
                <Card.Header>
                  <h5 className="mb-0">Revenue Overview</h5>
                </Card.Header>
                <Card.Body>
                  {revenueMetrics && (
                    <div>
                      <p><strong>Monthly Recurring Revenue:</strong> ${revenueMetrics.mrr}</p>
                      <p><strong>Period:</strong> {revenueMetrics.period}</p>
                      <div className="mt-3">
                        <h6>Subscription Status Distribution:</h6>
                        {revenueMetrics.subscriptions.map((sub, index) => (
                          <Badge key={index} bg={sub._id === 'active' ? 'success' : 'secondary'} className="me-2">
                            {sub._id}: {sub.count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="mb-3">
                <Card.Header>
                  <h5 className="mb-0">Quick Actions</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-grid gap-2">
                    <Button variant="success" size="sm" onClick={() => setSelectedUser({}); setShowUserModal(true)}>
                      Grant Lifetime Access
                    </Button>
                    <Button variant="info" size="sm" onClick={() => setSelectedUser({}); setShowUserModal(true)}>
                      Extend Free Trial
                    </Button>
                    <Button variant="warning" size="sm" onClick={() => setSelectedUser({}); setShowUserModal(true)}>
                      Force Downgrade
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card>
            <Card.Header>
              <h5 className="mb-0">Subscription Management</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive striped hover>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Site</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th>Expires</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((subscription, index) => (
                    <tr key={index}>
                      <td>{subscription.user_id?.name || 'Unknown'}</td>
                      <td>{subscription.site_id?.domain || 'N/A'}</td>
                      <td>${subscription.amount}</td>
                      <td>{getStatusBadge(subscription.status)}</td>
                      <td>{subscription.type}</td>
                      <td>{subscription.expires_at ? new Date(subscription.expires_at).toLocaleDateString() : 'Never'}</td>
                      <td>{new Date(subscription.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="system" title={<span><FaTools className="me-2" />System & Communication</span>}>
          {/* System and Communication Management */}
          <Row>
            <Col md={6}>
              <Card className="mb-3">
                <Card.Header>
                  <h5 className="mb-0">Communication Tools</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-grid gap-2">
                    <Button variant="primary" onClick={() => setShowAnnouncementModal(true)}>
                      <FaBullhorn className="me-2" />
                      Create Global Announcement
                    </Button>
                    <Button variant="warning" onClick={() => setShowNotificationModal(true)}>
                      <FaBell className="me-2" />
                      Send Push Notification
                    </Button>
                    <Button variant="danger" onClick={() => setShowMaintenanceModal(true)}>
                      <FaTools className="me-2" />
                      Toggle Maintenance Mode
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="mb-3">
                <Card.Header>
                  <h5 className="mb-0">Storage & Data</h5>
                </Card.Header>
                <Card.Body>
                  {storageUsage && (
                    <div>
                      <p><strong>Total Usage:</strong> {storageUsage.total_usage}</p>
                      <p><strong>Growth Trend:</strong> {storageUsage.growth_trend}</p>
                      <div className="mt-3">
                        <h6>Usage by Tier:</h6>
                        {Object.entries(storageUsage.by_user_tier).map(([tier, usage]) => (
                          <div key={tier} className="d-flex justify-content-between">
                            <span>{tier}:</span>
                            <span>{usage}</span>
                          </div>
                        ))}
                      </div>
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        className="mt-3"
                        onClick={() => setShowPurgeModal(true)}
                      >
                        <FaTrash className="me-2" />
                        Purge Old Data
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="reported" title={<span><FaFlag className="me-2" />Reported Content</span>}>
          {/* Reported Chats Management */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">Reported Chats</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive striped hover>
                <thead>
                  <tr>
                    <th>Chat ID</th>
                    <th>Site</th>
                    <th>Reported By</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reportedChats.map((report) => (
                    <tr key={report.id}>
                      <td>{report.chat_id}</td>
                      <td>{report.site_id}</td>
                      <td>{report.reported_by}</td>
                      <td>{report.reason}</td>
                      <td>{getStatusBadge(report.status)}</td>
                      <td>{new Date(report.created_at).toLocaleDateString()}</td>
                      <td>
                        <Button variant="outline-primary" size="sm">
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* User Modal */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>User Management</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <UserManagementModal
            user={selectedUser}
            onUpdate={handleUpdateUser}
            onGrantLifetime={handleGrantLifetimeAccess}
            onExtendTrial={handleExtendTrial}
            onForceDowngrade={handleForceDowngrade}
          />
        </Modal.Body>
      </Modal>

      {/* Announcement Modal */}
      <Modal show={showAnnouncementModal} onHide={() => setShowAnnouncementModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Global Announcement</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AnnouncementModal onSubmit={handleCreateAnnouncement} />
        </Modal.Body>
      </Modal>

      {/* Notification Modal */}
      <Modal show={showNotificationModal} onHide={() => setShowNotificationModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Send Push Notification</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <NotificationModal onSubmit={handleSendNotification} />
        </Modal.Body>
      </Modal>

      {/* Maintenance Modal */}
      <Modal show={showMaintenanceModal} onHide={() => setShowMaintenanceModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Maintenance Mode</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <MaintenanceModal onSubmit={handleToggleMaintenance} />
        </Modal.Body>
      </Modal>

      {/* Purge Data Modal */}
      <Modal show={showPurgeModal} onHide={() => setShowPurgeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Purge Old Data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <PurgeDataModal onSubmit={handlePurgeData} />
        </Modal.Body>
      </Modal>
    </Container>
  );
};

// Sub-components for modals
const UserManagementModal = ({ user, onUpdate, onGrantLifetime, onExtendTrial, onForceDowngrade }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    plan: user?.plan || 'free',
    role: user?.role || 'user'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(user.id, formData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Plan</Form.Label>
            <Form.Select
              value={formData.plan}
              onChange={(e) => setFormData({...formData, plan: e.target.value})}
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
              <option value="lifetime">Lifetime</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Role</Form.Label>
            <Form.Select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
      <div className="d-flex justify-content-between">
        <Button variant="primary" type="submit">
          Update User
        </Button>
        <div>
          <Button 
            variant="success" 
            size="sm" 
            className="me-2"
            onClick={() => {
              if (confirm('Grant lifetime access to this user?')) {
                onGrantLifetime(user.id);
              }
            }}
          >
            Grant Lifetime
          </Button>
          <Button 
            variant="info" 
            size="sm" 
            className="me-2"
            onClick={() => {
              const days = prompt('Enter number of days to extend trial:');
              if (days && !isNaN(days)) {
                onExtendTrial(user.id, parseInt(days));
              }
            }}
          >
            Extend Trial
          </Button>
          <Button 
            variant="warning" 
            size="sm"
            onClick={() => {
              const reason = prompt('Enter downgrade reason:');
              if (reason) {
                onForceDowngrade(user.id, reason);
              }
            }}
          >
            Force Downgrade
          </Button>
        </div>
      </div>
    </Form>
  );
};

const AnnouncementModal = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    duration: 24,
    target: 'all'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Title</Form.Label>
        <Form.Control
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Message</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={formData.message}
          onChange={(e) => setFormData({...formData, message: e.target.value})}
          required
        />
      </Form.Group>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Type</Form.Label>
            <Form.Select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="success">Success</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Duration (hours)</Form.Label>
            <Form.Control
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
              min="1"
              max="168"
            />
          </Form.Group>
        </Col>
      </Row>
      <Form.Group className="mb-3">
        <Form.Label>Target</Form.Label>
        <Form.Select
          value={formData.target}
          onChange={(e) => setFormData({...formData, target: e.target.value})}
        >
          <option value="all">All Users</option>
          <option value="admins">Admins Only</option>
          <option value="users">Regular Users Only</option>
        </Form.Select>
      </Form.Group>
      <Button variant="primary" type="submit">
        Create Announcement
      </Button>
    </Form>
  );
};

const NotificationModal = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    message: '',
    type: 'system',
    priority: 'normal'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Alert variant="warning">
      <Alert.Heading>⚠️ Warning</Alert.Heading>
      <p>
        This will send a push notification to <strong>ALL</strong> active chat widgets across the platform.
        Use with extreme caution!
      </p>
      <hr />
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Message</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            required
          />
        </Form.Group>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="system">System</option>
                <option value="maintenance">Maintenance</option>
                <option value="alert">Alert</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Priority</Form.Label>
              <Form.Select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
        <Button variant="warning" type="submit">
          Send Notification
        </Button>
      </Form>
    </Alert>
  );
};

const MaintenanceModal = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    enabled: true,
    message: 'Site is under maintenance',
    duration: null
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Alert variant="info">
        <FaExclamationTriangle className="me-2" />
        This will enable/disable maintenance mode for the entire platform.
      </Alert>
      <Form.Group className="mb-3">
        <Form.Check
          type="switch"
          id="maintenance-switch"
          label="Enable Maintenance Mode"
          checked={formData.enabled}
          onChange={(e) => setFormData({...formData, enabled: e.target.checked})}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Maintenance Message</Form.Label>
        <Form.Control
          type="text"
          value={formData.message}
          onChange={(e) => setFormData({...formData, message: e.target.value})}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Duration (hours, optional)</Form.Label>
        <Form.Control
          type="number"
          value={formData.duration || ''}
          onChange={(e) => setFormData({...formData, duration: e.target.value ? parseInt(e.target.value) : null})}
          min="1"
          max="72"
        />
      </Form.Group>
      <Button variant={formData.enabled ? 'danger' : 'success'} type="submit">
        {formData.enabled ? 'Enable Maintenance' : 'Disable Maintenance'}
      </Button>
    </Form>
  );
};

const PurgeDataModal = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    days: 90,
    target: 'free_users',
    dry_run: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Alert variant="danger">
      <Alert.Heading>⚠️ Danger Zone</Alert.Heading>
      <p>
        This will permanently delete chat data. This action cannot be undone.
        Use with extreme caution!
      </p>
      <hr />
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Delete data older than (days)</Form.Label>
          <Form.Control
            type="number"
            value={formData.days}
            onChange={(e) => setFormData({...formData, days: parseInt(e.target.value)})}
            min="7"
            max="365"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Target</Form.Label>
          <Form.Select
            value={formData.target}
            onChange={(e) => setFormData({...formData, target: e.target.value})}
          >
            <option value="free_users">Free tier users only</option>
            <option value="all">All users</option>
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Check
            type="switch"
            id="dry-run-switch"
            label="Dry run (show what would be deleted)"
            checked={formData.dry_run}
            onChange={(e) => setFormData({...formData, dry_run: e.target.checked})}
          />
        </Form.Group>
        <Button variant="danger" type="submit">
          {formData.dry_run ? 'Preview Deletion' : 'Purge Data'}
        </Button>
      </Form>
    </Alert>
  );
};

export default SuperAdminDashboard;
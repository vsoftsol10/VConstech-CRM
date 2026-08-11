import DepartmentTicketTable from "../DepartmentTicketTable";

export default function TechnicalTable({ tickets = [], setTickets, loading = false, error = "" }) {
  const handleDelete = (id) => {
    setTickets((prev) => prev.filter((ticket) => String(ticket.id) !== String(id)));
  };

  const handleTicketSaved = (updatedTicket) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        String(ticket.id) === String(updatedTicket.id)
          ? {
              ...ticket,
              status: updatedTicket.state === "In Progress" ? "In progress" : updatedTicket.state || ticket.status,
              description: updatedTicket.short_description || ticket.description,
              assignTo: updatedTicket.employee_name || updatedTicket.assigned_to || ticket.assignTo,
              priority: updatedTicket.urgency || ticket.priority,
              raw: updatedTicket,
            }
          : ticket
      )
    );
  };

  return (
    <DepartmentTicketTable
      tickets={tickets}
      loading={loading}
      error={error}
      onDelete={handleDelete}
      onTicketSaved={handleTicketSaved}
      emptyLabel="No technical tickets found"
    />
  );
}

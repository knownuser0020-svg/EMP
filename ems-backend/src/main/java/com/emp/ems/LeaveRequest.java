package com.emp.ems;
import jakarta.persistence.*;import java.time.LocalDate;import java.util.UUID;
@Entity @Table(name="leave_requests",indexes={@Index(name="idx_leave_employee_dates",columnList="employee_id,start_date,end_date"),@Index(name="idx_leave_status",columnList="status")})
public class LeaveRequest {
 @Id UUID id=UUID.randomUUID();@Version long version=0;@ManyToOne(fetch=FetchType.LAZY,optional=false)@JoinColumn(name="employee_id",nullable=false)Employee employee;@Column(nullable=false,length=20)String type;@Column(nullable=false)LocalDate startDate;@Column(nullable=false)LocalDate endDate;@Column(nullable=false,length=20)String status="Pending";@Column(length=500)String reason;
 protected LeaveRequest(){}record View(UUID id,UUID employeeId,String type,LocalDate startDate,LocalDate endDate,String status,String reason){}
 View view(){return new View(id,employee.id,type,startDate,endDate,status,reason);}
}

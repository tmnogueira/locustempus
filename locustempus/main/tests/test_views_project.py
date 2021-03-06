"""Tests for the Project views"""
from django.test import TestCase
from django.urls.base import reverse
from locustempus.main.tests.factories import (
    CourseTestMixin, ProjectFactory
)


class ProjectTest(CourseTestMixin, TestCase):
    def setUp(self):
        self.setup_course()

    def test_create_project_faculty(self):
        """Test that faculty can create projects"""
        self.assertTrue(
            self.client.login(
                username=self.faculty.username,
                password='test'
            )
        )
        response = self.client.post(
            reverse(
                'course-project-create', args=[self.sandbox_course.pk]),
            {
                'title': 'A Test Project',
                'description': 'A fine description',
                'base_map': 'dark-v10'
            }
        )
        self.assertEqual(response.status_code, 302)

    def test_create_project_student(self):
        """Test that students can't create projects"""
        self.assertTrue(
            self.client.login(
                username=self.student.username,
                password='test'
            )
        )
        response = self.client.get(
            reverse('course-project-create', args=[self.sandbox_course.pk]))
        self.assertEqual(response.status_code, 403)

    def test_delete_project_faculty(self):
        """Test that faculty can delete projects"""
        project = ProjectFactory.create(course=self.sandbox_course)
        project_pk = project.pk
        self.assertTrue(
            self.client.login(
                username=self.faculty.username,
                password='test'
            )
        )
        response = self.client.post(
            reverse(
                'course-project-delete',
                args=[self.sandbox_course.pk, project.pk]),
        )
        self.assertEqual(response.status_code, 302)
        r2 = self.client.get(
            reverse('course-project-detail',
                    args=[self.sandbox_course.pk, project_pk]))
        self.assertEqual(r2.status_code, 404)

    def test_delete_project_students(self):
        """Test that students can not delete projects"""
        project = ProjectFactory.create(course=self.sandbox_course)
        self.assertTrue(
            self.client.login(
                username=self.student.username,
                password='test'
            )
        )
        response = self.client.post(
            reverse(
                'course-project-delete',
                args=[self.sandbox_course.pk, project.pk]),
        )
        self.assertEqual(response.status_code, 403)

    def test_list_project_faculty(self):
        """Test that students and faculty can list projects"""
        p1 = ProjectFactory.create(course=self.sandbox_course)
        p2 = ProjectFactory.create(course=self.sandbox_course)
        self.assertTrue(
            self.client.login(
                username=self.faculty.username,
                password='test'
            )
        )
        response = self.client.get(
            reverse('course-detail-view', args=[self.sandbox_course.pk]))
        self.assertIn(p1, response.context['projects'])
        self.assertIn(p2, response.context['projects'])
        self.assertContains(response, 'Create New Project')

    def test_list_project_students(self):
        """Test that students and faculty can list projects"""
        p1 = ProjectFactory(course=self.sandbox_course)
        p2 = ProjectFactory(course=self.sandbox_course)
        self.assertTrue(
            self.client.login(
                username=self.student.username,
                password='test'
            )
        )
        response = self.client.get(
            reverse('course-detail-view', args=[self.sandbox_course.pk]))
        self.assertIn(p1, response.context['projects'])
        self.assertIn(p2, response.context['projects'])
        self.assertNotContains(response, 'Create New Project')

    def test_detail_project_faculty(self):
        """Test that faculty can view a project"""
        self.assertTrue(
            self.client.login(
                username=self.faculty.username,
                password='test'
            )
        )
        project = self.sandbox_course.projects.first()
        response = self.client.get(
            reverse('course-project-detail',
                    args=[self.sandbox_course.pk, project.pk]))
        self.assertEqual(response.status_code, 200)

    def test_detail_project_students(self):
        """Test that students can view a project"""
        project = ProjectFactory.create(course=self.sandbox_course)
        self.assertTrue(
            self.client.login(
                username=self.student.username,
                password='test'
            )
        )
        response = self.client.get(
            reverse('course-project-detail',
                    args=[self.sandbox_course.pk, project.pk]))
        self.assertEqual(response.status_code, 200)
